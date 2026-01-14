'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { LocationMap, type WardLocation } from '../../components/LocationMap';
import MonitoringSidebar from '../../components/monitoring/MonitoringSidebar';
import { useApi } from '../../hooks/useApi';
import { apiClient } from '../../lib/api-client';
import DetailModal, {
  type BeneficiaryDetail,
  type BeneficiaryUpdatePayload,
  type BeneficiarySummary,
} from '../beneficiaries/DetailModal';
import '../../styles/monitoring.css';

type LocationsResponse = {
  locations: WardLocation[];
};

type BeneficiaryDetailResponse = {
  data: BeneficiaryDetail & { id: string };
};

type MyWardsResponse = {
  wards: Array<{
    id: string;
    wardId: string | null;
    name: string;
    phoneNumber?: string;
    address?: string;
    birthDate?: string;
  }>;
};

const EMPTY_DETAIL: BeneficiaryDetail = {
  name: '',
  email: null,
  phoneNumber: null,
  birthDate: null,
  address: null,
  gender: null,
  type: null,
  emergencyContact: null,
  diseases: [],
  medication: null,
  notes: null,
  recentLogs: [],
};

// --- Hook for Beneficiary Logic ---
function useBeneficiaryDetail(selectedWardId: string | null, locations: WardLocation[]) {
  // 1-1. Fetch MyWards for ID Mapping
  const { data: myWardsData } = useApi<MyWardsResponse>({
    deps: [],
    fetcher: (client, signal) => client.get('/v1/admin/my-wards', { signal }),
  });

  // Build ID Mapping: wardId -> beneficiaryId
  const wardIdToBeneficiaryId = useMemo(() => {
    const map = new Map<string, string>();
    if (myWardsData?.wards && Array.isArray(myWardsData.wards)) {
      myWardsData.wards.forEach(w => {
        if (w.wardId && w.id) {
          map.set(w.wardId, w.id);
        }
      });
    }
    return map; // Stable reference unless data changes
  }, [myWardsData]);

  // Resolve Target ID
  const targetBeneficiaryId = useMemo(() => {
    if (!selectedWardId) return null;
    return wardIdToBeneficiaryId.get(selectedWardId) || selectedWardId;
  }, [selectedWardId, wardIdToBeneficiaryId]);

  // 1-2. Fetch Detail
  const {
    data: detailResponse,
    refetch: refetchDetail,
    error: detailError,
  } = useApi<BeneficiaryDetailResponse>({
    deps: [targetBeneficiaryId],
    skip: !targetBeneficiaryId,
    fetcher: (client, signal) => {
      if (!targetBeneficiaryId) throw new Error('No Target ID');
      return client.get(`/v1/admin/beneficiaries/${targetBeneficiaryId}`, { signal });
    },
  });

  // Construct Final Data Object
  const selectedData = useMemo(() => {
    if (!selectedWardId) return null;

    const location = locations.find(loc => loc.wardId === selectedWardId);
    if (!location) return null;

    // Summary from Location
    const summary: BeneficiarySummary = {
      id: targetBeneficiaryId || location.wardId,
      name: location.wardName,
      status: location.status === 'emergency' ? 'WARNING' : location.status === 'warning' ? 'CAUTION' : 'NORMAL',
      isRegistered: true,
      phoneNumber: null,
      address: null,
      age: null,
      gender: null,
      manager: null,
      emergencyContact: null,
      lastCall: null,
      type: null
    };

    const detailApiData = detailResponse?.data;
    const isMatchingData = detailApiData && detailApiData.id === targetBeneficiaryId;

    const detail: BeneficiaryDetail = isMatchingData
      ? detailApiData
      : {
        ...EMPTY_DETAIL,
        name: location.wardName,
      };

    // Enrich from MyWards if needed
    if (!isMatchingData && myWardsData?.wards) {
      const wardInfo = myWardsData.wards.find(w => w.wardId === selectedWardId);
      if (wardInfo) {
        if (!detail.name) detail.name = wardInfo.name;
        if (wardInfo.phoneNumber) detail.phoneNumber = wardInfo.phoneNumber;
        if (wardInfo.address) detail.address = wardInfo.address;
        if (wardInfo.birthDate) detail.birthDate = wardInfo.birthDate;
      }
    }

    return { summary, detail, refetchDetail };
  }, [selectedWardId, locations, detailResponse, targetBeneficiaryId, myWardsData, refetchDetail]);

  return { selectedData, detailError };
}

export default function LocationsPage() {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

  // 1. Fetch Locations
  const { data: locationsDataRaw, loading: locationsLoading, refetch: refetchLocations } = useApi<unknown>({
    deps: [],
    fetcher: (client, signal) => client.get('/v1/admin/locations', { signal }),
  });

  const locations: WardLocation[] = useMemo(() => {
    if (!locationsDataRaw) return [];
    if (Array.isArray(locationsDataRaw)) return locationsDataRaw as WardLocation[];
    const response = locationsDataRaw as LocationsResponse;
    if (Array.isArray(response.locations)) return response.locations;
    return [];
  }, [locationsDataRaw]);

  useEffect(() => {
    const interval = setInterval(() => refetchLocations(), 30000);
    return () => clearInterval(interval);
  }, [refetchLocations]);

  // 2. Use Custom Hook for Details
  const { selectedData, detailError } = useBeneficiaryDetail(selectedWardId, locations);

  // Error Handling (Toast or alert could be better, for now console/alert)
  useEffect(() => {
    if (detailError && selectedWardId) {
      console.error("Failed to load details:", detailError);
      // Optional: Trigger a toast here if we had a toast system
    }
  }, [detailError, selectedWardId]);

  const handleUpdate = async (payload: BeneficiaryUpdatePayload) => {
    if (!selectedData) return null;
    try {
      const result = await apiClient.put<BeneficiaryDetailResponse>(
        `/v1/admin/beneficiaries/${selectedData.summary.id}`,
        payload
      );
      selectedData.refetchDetail();
      return result.data;
    } catch (err) {
      console.error(err);
      throw new Error('Update failed');
    }
  };

  return (
    <DashboardLayout noPadding>
      <div className="monitoring-container">
        <main className="monitoring-map-section">
          {locationsLoading && locations.length === 0 && (
            <div className="map-loading-overlay">데이터 불러오는 중...</div>
          )}
          <LocationMap
            locations={locations}
            selectedWardId={selectedWardId || undefined}
            onWardClick={setSelectedWardId}
          />
        </main>

        <MonitoringSidebar
          locations={locations}
          selectedWardId={selectedWardId}
          onSelect={setSelectedWardId}
        />

        {selectedData && (
          <DetailModal
            beneficiary={selectedData.summary}
            detail={selectedData.detail}
            onClose={() => setSelectedWardId(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
