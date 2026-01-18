'use client';

import { useState, useEffect, useCallback } from 'react';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DailyOperationsSummary,
  DailyOperationsData,
  OperationsTimeline,
  BulletinBoard,
  BulletinItem,
  HourlyCallData,
  UpcomingCalls,
  UpcomingCall,
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
  const [upcomingCalls, setUpcomingCalls] = useState<UpcomingCall[]>([]);
  const [upcomingCallsLoading, setUpcomingCallsLoading] = useState(true);

  const { listBulletins, createBulletin, updateBulletin, deleteBulletin } =
    useBulletinsApi();
  const { getTimeline, getTodaySummary, getUpcomingCalls } = useDashboardApi();

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

  // Load upcoming calls on mount and refresh every minute
  const loadUpcomingCalls = useCallback(async () => {
    setUpcomingCallsLoading(true);
    const result = await getUpcomingCalls(2); // Next 2 hours
    if (result && result.calls) {
      setUpcomingCalls(result.calls);
    }
    setUpcomingCallsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTodaySummary();
    loadBulletins();
    loadTimeline();
    loadUpcomingCalls();

    // Refresh upcoming calls every minute
    const interval = setInterval(loadUpcomingCalls, 60000);
    return () => clearInterval(interval);
  }, [loadTodaySummary, loadBulletins, loadTimeline, loadUpcomingCalls]);

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

  return (
    <DashboardLayout
      csvModalOpen={csvModalOpen}
      onCsvModalOpenChange={setCsvModalOpen}
    >
      <div className="dashboard-container">
        {/* Row 1: Daily Operations Summary (full width) */}
        <DailyOperationsSummary data={todaySummary} loading={summaryLoading} />

        {/* Row 2: Bulletin Board (full width) */}
        <section className="dashboard-bulletin-row">
          <BulletinBoard
            items={bulletinItems}
            onAdd={handleAddBulletin}
            onEdit={handleEditBulletin}
            onDelete={handleDeleteBulletin}
            loading={bulletinsLoading}
          />
        </section>

        {/* Row 3: Upcoming Calls (left) + Timeline (right) */}
        <section className="dashboard-bottom-row">
          {/* Left: Upcoming Calls */}
          <UpcomingCalls
            calls={upcomingCalls}
            loading={upcomingCallsLoading}
          />

          {/* Right: Timeline Chart */}
          <OperationsTimeline
            data={timelineData.length > 0 ? timelineData : undefined}
            loading={timelineLoading}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
