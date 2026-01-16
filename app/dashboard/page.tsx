'use client';

import { useState, useEffect, useCallback } from 'react';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DailyOperationsSummary,
  DailyOperationsData,
  OperationsTimeline,
  EmergencyLog,
  BulletinBoard,
  BulletinItem,
  EmergencyLogItem,
  HourlyCallData,
} from '../../components/dashboard';
import { useBulletinsApi, useDashboardApi } from '../../hooks';
import '../../styles/dashboard.css';

// Helper to format date as MM/DD
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
};

// --- Page Component ---

export default function DashboardPage() {
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [bulletinItems, setBulletinItems] = useState<BulletinItem[]>([]);
  const [bulletinsLoading, setBulletinsLoading] = useState(true);
  const [timelineData, setTimelineData] = useState<HourlyCallData[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState<
    DailyOperationsData | undefined
  >(undefined);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLogItem[]>([]);
  const [emergencyLoading, setEmergencyLoading] = useState(true);

  const { listBulletins, createBulletin, updateBulletin, deleteBulletin } =
    useBulletinsApi();
  const { getTimeline, getTodaySummary, getCareAlerts } = useDashboardApi();

  // Load today's summary on mount
  const loadTodaySummary = useCallback(async () => {
    setSummaryLoading(true);
    const result = await getTodaySummary();
    if (result) {
      setTodaySummary({
        totalCalls: result.totalCalls,
        incomingCalls: result.incomingCalls,
        outgoingCalls: result.outgoingCalls,
        totalDurationMinutes: result.totalDurationMinutes,
        avgDurationMinutes: result.avgDurationMinutes,
        scheduledCheckIns: result.scheduledCheckIns,
        completedCheckIns: result.completedCheckIns,
      });
    }
    setSummaryLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load bulletins on mount
  const loadBulletins = useCallback(async () => {
    setBulletinsLoading(true);
    const result = await listBulletins();
    if (result && result.data) {
      // Transform API response to component format
      const items: BulletinItem[] = result.data.map(b => ({
        id: b.id,
        date: formatDate(b.createdAt),
        title: b.title,
        content: b.content,
        author: b.author || 'Unknown',
      }));
      setBulletinItems(items);
    }
    setBulletinsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load timeline on mount
  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true);
    const result = await getTimeline();
    if (result && result.timeline) {
      // Transform API response to component format
      const data: HourlyCallData[] = result.timeline.map(h => ({
        hour: h.label,
        scheduled: h.scheduled,
        actual: h.actual,
        incoming: h.incoming,
      }));
      setTimelineData(data);
    }
    setTimelineLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load care alerts on mount
  const loadCareAlerts = useCallback(async () => {
    setEmergencyLoading(true);
    const result = await getCareAlerts({ limit: 50, hoursBack: 24 });
    if (result && result.logs) {
      const items: EmergencyLogItem[] = result.logs.map(log => ({
        id: log.id,
        datetime: new Date(log.timestamp),
        beneficiaryName: log.wardName,
        type: log.type,
        status: log.status,
        manager: '',
        summary: '',
      }));
      setEmergencyLogs(items);
    }
    setEmergencyLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTodaySummary();
    loadBulletins();
    loadTimeline();
    loadCareAlerts();
  }, [loadTodaySummary, loadBulletins, loadTimeline, loadCareAlerts]);

  const handleAddBulletin = async (item: Omit<BulletinItem, 'id'>) => {
    const result = await createBulletin({
      title: item.title,
      content: item.content,
    });
    if (result) {
      // Refresh list to get server-assigned id and author
      await loadBulletins();
    }
  };

  const handleEditBulletin = async (
    id: string,
    item: Omit<BulletinItem, 'id'>,
  ) => {
    await updateBulletin(id, {
      title: item.title,
      content: item.content,
    });
    // Refresh list
    await loadBulletins();
  };

  const handleDeleteBulletin = async (id: string) => {
    await deleteBulletin(id);
    // Refresh list
    await loadBulletins();
  };

  const handleUpdateEmergency = (
    id: string,
    updates: { manager?: string; summary?: string },
  ) => {
    setEmergencyLogs(prev =>
      prev.map(log => (log.id === id ? { ...log, ...updates } : log)),
    );
  };

  return (
    <DashboardLayout
      csvModalOpen={csvModalOpen}
      onCsvModalOpenChange={setCsvModalOpen}
    >
      <div className="dashboard-container">
        {/* Hero Section: Daily Operations Summary */}
        <DailyOperationsSummary data={todaySummary} loading={summaryLoading} />

        {/* Middle Row: Bulletin Board + Timeline Chart */}
        <section className="dashboard-middle-row">
          {/* Left: Bulletin Board */}
          <BulletinBoard
            items={bulletinItems}
            onAdd={handleAddBulletin}
            onEdit={handleEditBulletin}
            onDelete={handleDeleteBulletin}
            loading={bulletinsLoading}
          />

          {/* Right: Timeline Chart */}
          <OperationsTimeline
            data={timelineData.length > 0 ? timelineData : undefined}
            loading={timelineLoading}
          />
        </section>

        {/* Emergency Log */}
        <EmergencyLog
          logs={emergencyLogs}
          loading={emergencyLoading}
          onUpdate={handleUpdateEmergency}
        />
      </div>
    </DashboardLayout>
  );
}
