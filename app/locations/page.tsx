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

// Type from my-wards API to build the mapping
type MyWardsResponse = {
  wards: Array<{
    id: string;      // Beneficiary ID (used for details)
    wardId: string | null; // Device ID (used for location)
    name: string;
    // ... other fields
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

export default function LocationsPage() {
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

  // 1. Fetch Locations (Auto-refresh every 30s)
  const { data: locationsDataRaw, loading: locationsLoading, refetch: refetchLocations } = useApi<unknown>({
    deps: [],
    fetcher: (client, signal) => client.get('/v1/admin/locations', { signal }),
  });

  // 1-1. Fetch MyWards to map wardId (device) -> id (beneficiary)
  // This is needed because the location API relies on wardId, but details API uses beneficiary ID
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
    return map;
  }, [myWardsData]);

  // Robustly parse locations
  const locations: WardLocation[] = useMemo(() => {
    if (!locationsDataRaw) return [];
    if (Array.isArray(locationsDataRaw)) {
      return locationsDataRaw as WardLocation[];
    }
    const response = locationsDataRaw as LocationsResponse;
    if (Array.isArray(response.locations)) {
      return response.locations;
    }
    return [];
  }, [locationsDataRaw]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchLocations();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchLocations]);

  // Determine the correct ID to fetch details for
  const targetBeneficiaryId = useMemo(() => {
    if (!selectedWardId) return null;
    // Start with the selected ID (from map/list, which is wardId)
    // Check if we have a mapping to a beneficiary ID
    return wardIdToBeneficiaryId.get(selectedWardId) || selectedWardId;
  }, [selectedWardId, wardIdToBeneficiaryId]);

  // 2. Fetch Detail when Ward Selected (using the resolved ID)
  const {
    data: detailResponse,
    refetch: refetchDetail,
    error: detailError, // Allow checking for error
  } = useApi<BeneficiaryDetailResponse>({
    deps: [targetBeneficiaryId],
    skip: !targetBeneficiaryId,
    fetcher: (client, signal) => {
      if (!targetBeneficiaryId) throw new Error('No Target ID');
      return client.get(`/v1/admin/beneficiaries/${targetBeneficiaryId}`, { signal });
    },
  });

  // 3. Construct Data for Modal
  const selectedData = useMemo(() => {
    if (!selectedWardId) return null;

    const location = locations.find(loc => loc.wardId === selectedWardId);
    if (!location) return null;

    // Minimal Summary from Location Data
    const summary: BeneficiarySummary = {
      id: targetBeneficiaryId || location.wardId, // Use the resolved ID if available
      name: location.wardName,
      status: location.status === 'emergency' ? 'WARNING' : location.status === 'warning' ? 'CAUTION' : 'NORMAL',
      isRegistered: true,
      phoneNumber: null, // Location data doesn't have this
      address: null,
      age: null,
      gender: null,
      manager: null,
      emergencyContact: null,
      lastCall: null,
      type: null
    };

    // If detail fetch succeeded, use it. If not (or 404), fallback to partial data + empty fields.
    const detailApiData = detailResponse?.data;

    // Check if the loaded data matches our target ID
    const isMatchingData = detailApiData && detailApiData.id === targetBeneficiaryId;

    const detail: BeneficiaryDetail = isMatchingData
      ? detailApiData
      : {
        ...EMPTY_DETAIL,
        name: location.wardName, // Fallback name at minimum
        // We could try to enrich more here if myWardsData has it
      };

    // Try to enrich from myWardsData if detail API failed but we have ward info
    if (!isMatchingData && myWardsData?.wards) {
      const wardInfo = myWardsData.wards.find(w => w.wardId === selectedWardId);
      if (wardInfo) {
        if (!detail.name) detail.name = wardInfo.name;
        if (!detail.phoneNumber) detail.phoneNumber = wardInfo.phoneNumber;
        if (!detail.address) detail.address = wardInfo.address;
        if (wardInfo.birthDate) detail.birthDate = wardInfo.birthDate;
      }
    }

    return { summary, detail };
  }, [selectedWardId, locations, detailResponse, targetBeneficiaryId, myWardsData]);

  const handleUpdate = async (payload: BeneficiaryUpdatePayload) => {
    if (!targetBeneficiaryId) return null;
    try {
      const result = await apiClient.put<BeneficiaryDetailResponse>(
        `/v1/admin/beneficiaries/${targetBeneficiaryId}`,
        payload
      );
      refetchDetail();
      return result.data;
    } catch (err) {
      console.error(err);
      throw new Error('Update failed');
    }
  };

  return (
    <DashboardLayout noPadding>
      <div className="monitoring-container">
        {/* Map takes up the main area, Sidebar on the right */}
        <main className="monitoring-map-section">
          {locationsLoading && locations.length === 0 && (
            <div className="map-loading-overlay">
              데이터 불러오는 중...
            </div>
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
