'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, X, Search, ChevronLeft, ChevronRight, Paperclip, Download } from 'lucide-react';
import { Card, Button } from '../ui';
import '../../styles/dashboard.css';

// --- Types ---
export type BulletinAttachment = {
    name: string;
    url: string;
    size?: string;
};

export type BulletinItem = {
    id: string;
    date: string;
    title: string;
    content: string;
    author: string;
    attachments?: BulletinAttachment[];
};

type BulletinBoardProps = {
    items?: BulletinItem[];
    onAdd?: (item: Omit<BulletinItem, 'id'>) => void;
    onEdit?: (id: string, item: Omit<BulletinItem, 'id'>) => void;
    onDelete?: (id: string) => void;
    itemsPerPage?: number;
};

// Mock data
const MOCK_ITEMS: BulletinItem[] = [
    { id: '1', date: '01/11', title: '시스템 점검 안내', content: '01/15 02:00-04:00 시스템 점검이 예정되어 있습니다.', author: '관리자', attachments: [{ name: '점검일정.pdf', url: '#', size: '128KB' }] },
    { id: '2', date: '01/10', title: '신규 직원 교육', content: '신규 직원 교육 일정을 확인해주세요.', author: '김팀장' },
    { id: '3', date: '01/08', title: '알고리즘 업데이트', content: '위급 감지 알고리즘이 업데이트 되었습니다.', author: '시스템', attachments: [{ name: '업데이트노트.docx', url: '#', size: '45KB' }] },
    { id: '4', date: '01/07', title: '휴무일 공지', content: '설 연휴 휴무 안내입니다.', author: '관리자' },
    { id: '5', date: '01/05', title: '보안 업데이트', content: '보안 패치가 적용되었습니다.', author: '시스템' },
];

const ITEMS_PER_PAGE = 5;

/**
 * BulletinBoard
 *
 * Announcement board with search, pagination, file attachments, and CRUD functionality.
 */
export default function BulletinBoard({
    items = MOCK_ITEMS,
    onAdd,
    onEdit,
    onDelete,
    itemsPerPage = ITEMS_PER_PAGE,
}: BulletinBoardProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<BulletinItem | null>(null);
    const [editingItem, setEditingItem] = useState<BulletinItem | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formContent, setFormContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter items by search query
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(
            (item) =>
                item.title.toLowerCase().includes(query) ||
                item.content.toLowerCase().includes(query) ||
                item.author.toLowerCase().includes(query)
        );
    }, [items, searchQuery]);

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(start, start + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    // Reset to page 1 when search changes
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleOpenAdd = () => {
        setEditingItem(null);
        setFormTitle('');
        setFormContent('');
        setModalOpen(true);
    };

    const handleOpenEdit = (item: BulletinItem) => {
        setEditingItem(item);
        setFormTitle(item.title);
        setFormContent(item.content);
        setModalOpen(true);
    };

    const handleOpenDetail = (item: BulletinItem) => {
        setDetailItem(item);
    };

    const handleCloseDetail = () => {
        setDetailItem(null);
    };

    const handleClose = () => {
        setModalOpen(false);
        setFormTitle('');
        setFormContent('');
        setEditingItem(null);
    };

    const handleSave = () => {
        if (!formTitle.trim() || !formContent.trim()) return;

        const now = new Date();
        const date = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

        if (editingItem) {
            onEdit?.(editingItem.id, { date: editingItem.date, title: formTitle, content: formContent, author: editingItem.author, attachments: editingItem.attachments });
        } else {
            onAdd?.({ date, title: formTitle, content: formContent, author: '나' });
        }

        handleClose();
    };

    const handleDelete = (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            onDelete?.(id);
        }
    };

    return (
        <>
            <Card padding="md" className="dashboard-bulletin">
                <div className="dashboard-bulletin-header">
                    <MessageSquare size={24} />
                    <h3 className="dashboard-bulletin-title">공지사항</h3>
                    {/* Search Bar - inline in header */}
                    <div className="dashboard-bulletin-search">
                        <Search size={16} className="dashboard-bulletin-search-icon" />
                        <input
                            type="text"
                            className="dashboard-bulletin-search-input"
                            placeholder="검색..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleOpenAdd} className="dashboard-bulletin-add-btn">
                        <Plus size={16} />
                        <span>새 글</span>
                    </Button>
                </div>

                {/* Items List */}
                <div className="dashboard-bulletin-content">
                    {paginatedItems.length === 0 ? (
                        <div className="dashboard-bulletin-empty">검색 결과가 없습니다.</div>
                    ) : (
                        paginatedItems.map((item) => (
                            <div key={item.id} className="dashboard-bulletin-item" onClick={() => handleOpenDetail(item)}>
                                <span className="dashboard-bulletin-date">{item.date}</span>
                                <span className="dashboard-bulletin-text">
                                    {item.title}
                                    {item.attachments && item.attachments.length > 0 && (
                                        <Paperclip size={14} className="dashboard-bulletin-attachment-icon" />
                                    )}
                                </span>
                                <span className="dashboard-bulletin-author">{item.author}</span>
                                <div className="dashboard-bulletin-actions dashboard-bulletin-actions-visible" onClick={(e) => e.stopPropagation()}>
                                    <button className="dashboard-bulletin-action" onClick={() => handleOpenEdit(item)}>
                                        <Edit2 size={16} />
                                    </button>
                                    <button className="dashboard-bulletin-action dashboard-bulletin-action-danger" onClick={() => handleDelete(item.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="dashboard-bulletin-pagination">
                        <button
                            className="dashboard-bulletin-page-btn"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="dashboard-bulletin-page-info">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className="dashboard-bulletin-page-btn"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </Card>

            {/* Detail Modal */}
            {detailItem && (
                <div className="bulletin-overlay" onClick={handleCloseDetail}>
                    <div className="bulletin-dialog bulletin-dialog-detail" onClick={(e) => e.stopPropagation()}>
                        <div className="bulletin-dialog-header">
                            <h3>{detailItem.title}</h3>
                            <button className="bulletin-dialog-close" onClick={handleCloseDetail}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bulletin-dialog-body">
                            <div className="bulletin-detail-meta">
                                <span>{detailItem.date}</span>
                                <span>·</span>
                                <span>{detailItem.author}</span>
                            </div>
                            <p className="bulletin-detail-content">{detailItem.content}</p>
                            {detailItem.attachments && detailItem.attachments.length > 0 && (
                                <div className="bulletin-detail-attachments">
                                    <h4 className="bulletin-detail-attachments-title">첨부파일</h4>
                                    {detailItem.attachments.map((file, idx) => (
                                        <a key={idx} href={file.url} download className="bulletin-detail-attachment">
                                            <Paperclip size={16} />
                                            <span>{file.name}</span>
                                            {file.size && <span className="bulletin-detail-attachment-size">{file.size}</span>}
                                            <Download size={16} className="bulletin-detail-download-icon" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="bulletin-dialog-footer">
                            <button className="bulletin-dialog-cancel" onClick={handleCloseDetail}>닫기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="bulletin-overlay" onClick={handleClose}>
                    <div className="bulletin-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="bulletin-dialog-header">
                            <h3>{editingItem ? '공지 수정' : '공지 작성'}</h3>
                            <button className="bulletin-dialog-close" onClick={handleClose}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="bulletin-dialog-body">
                            <div className="bulletin-dialog-field">
                                <label className="bulletin-dialog-label">제목</label>
                                <input
                                    type="text"
                                    className="bulletin-dialog-input"
                                    placeholder="공지 제목을 입력하세요"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="bulletin-dialog-field">
                                <label className="bulletin-dialog-label">내용</label>
                                <textarea
                                    className="bulletin-dialog-textarea"
                                    placeholder="공지 내용을 입력하세요..."
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    rows={4}
                                />
                            </div>
                            <div className="bulletin-dialog-field">
                                <label className="bulletin-dialog-label">첨부파일</label>
                                <div className="bulletin-dialog-file-input">
                                    <Paperclip size={16} />
                                    <span>파일 첨부 (준비중)</span>
                                </div>
                            </div>
                        </div>
                        <div className="bulletin-dialog-footer">
                            <button className="bulletin-dialog-cancel" onClick={handleClose}>취소</button>
                            <button className="bulletin-dialog-save" onClick={handleSave}>{editingItem ? '수정' : '작성'}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
