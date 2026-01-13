'use client';

import { useState, useEffect, useCallback } from 'react';

import DashboardLayout from '../../components/layouts/DashboardLayout';
import {
  DailyOperationsSummary,
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

  const { listBulletins, createBulletin, updateBulletin, deleteBulletin } =
    useBulletinsApi();
  const { getTimeline } = useDashboardApi();

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
  }, [listBulletins]);

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
  }, [getTimeline]);

  useEffect(() => {
    loadBulletins();
    loadTimeline();
  }, [loadBulletins, loadTimeline]);

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

  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyLogItem[]>([
    {
      id: '1',
      datetime: new Date(2026, 0, 10, 14, 32),
      beneficiaryName: '김순자',
      type: '낙상 감지',
      status: 'resolved',
      manager: '박간호사',
      summary:
        '거실에서 낙상 감지됨. 즉시 방문하여 확인 결과 경미한 타박상. 보호자 연락 완료.',
    },
    {
      id: '2',
      datetime: new Date(2026, 0, 10, 11, 15),
      beneficiaryName: '박영희',
      type: '응답 없음',
      status: 'pending',
      manager: '',
      summary: '',
    },
    {
      id: '3',
      datetime: new Date(2026, 0, 9, 16, 48),
      beneficiaryName: '이철수',
      type: '이상 발화',
      status: 'resolved',
      manager: '김담당',
      summary:
        '통화 중 반복적인 혼란 발화 감지. 방문 확인 결과 일시적 혼란 상태. 보호자 상담 진행.',
    },
  ]);

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
        <DailyOperationsSummary />

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
        <EmergencyLog logs={emergencyLogs} onUpdate={handleUpdateEmergency} />
      </div>
    </DashboardLayout>
  );
}
