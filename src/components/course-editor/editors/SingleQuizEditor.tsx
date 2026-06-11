/**
 * SingleQuizEditor — Editor form cho Quiz 1 đáp án + Media
 *
 * Layout & CSS clone CHÍNH XÁC từ ProblemEditor.
 * 
 * DEFERRED UPLOAD: Ảnh KHÔNG được upload ngay lập tức.
 * - Khi user chọn file → tạo blob preview + lưu File object vào pendingFiles
 * - Khi user bấm Save (từ UnitEditor) → parent upload pending files trước rồi mới save
 * - Khi user tắt modal không save → không có gì bị upload lên server
 */
import React, { useState, useRef } from 'react';
import { Plus, Trash2, ImagePlus, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteCourseAsset } from '@/api/course-authoring';
import RichTextEditor from '../RichTextEditor';

// ── Types ──

export interface QuizChoice {
  id: string;
  html: string;
  correct: boolean;
}

/** File đang chờ upload (chỉ upload khi save) */
export interface PendingFile {
  file: File;
  previewUrl: string; // blob URL để hiển thị preview
}

interface SingleQuizEditorProps {
  displayName: string;
  onDisplayNameChange: (v: string) => void;
  questionHtml: string;
  onQuestionChange: (v: string) => void;
  choices: QuizChoice[];
  onChoicesChange: (c: QuizChoice[]) => void;
  images: string[];
  onImagesChange: (imgs: string[]) => void;
  pendingFiles: PendingFile[];
  onPendingFilesChange: (files: PendingFile[]) => void;
  videoUrl: string;
  onVideoUrlChange: (v: string) => void;
  explanationHtml: string;
  onExplanationChange: (v: string) => void;
  hints: string[];
  onHintsChange: (h: string[]) => void;
  courseId?: string;
}

// ── Helper: extract YouTube ID ──

function extractYoutubeId(input: string): string {
  if (!input) return '';
  const regexes = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const r of regexes) {
    const m = input.match(r);
    if (m) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return input.trim();
}

// ── Main Editor ──

export default function SingleQuizEditor({
  displayName, onDisplayNameChange,
  questionHtml, onQuestionChange,
  choices, onChoicesChange,
  images, onImagesChange,
  pendingFiles, onPendingFilesChange,
  videoUrl, onVideoUrlChange,
  explanationHtml, onExplanationChange,
  hints, onHintsChange,
  courseId,
}: SingleQuizEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Deferred image: chỉ tạo blob preview, KHÔNG upload ──
  const handleFileSelected = (file: File) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onPendingFilesChange([...pendingFiles, { file, previewUrl }]);
  };

  // ── Choice helpers ──
  const handleAddChoice = () => {
    const newId = `c-${Date.now()}`;
    onChoicesChange([...choices, { id: newId, html: 'Đáp án mới', correct: false }]);
  };

  const handleUpdateChoice = (id: string, updates: Partial<QuizChoice>) => {
    // Single quiz: nếu set correct → uncheck tất cả trước
    if (updates.correct === true) {
      onChoicesChange(choices.map(c => c.id === id ? { ...c, ...updates } : { ...c, correct: false }));
    } else {
      onChoicesChange(choices.map(c => c.id === id ? { ...c, ...updates } : c));
    }
  };

  const handleDeleteChoice = (id: string) => {
    onChoicesChange(choices.filter(c => c.id !== id));
  };

  // ── Hint helpers ──
  const handleAddHint = () => onHintsChange([...hints, 'Gợi ý mới']);
  const handleUpdateHint = (idx: number, val: string) => {
    const newHints = [...hints];
    newHints[idx] = val;
    onHintsChange(newHints);
  };
  const handleDeleteHint = (idx: number) => {
    const newHints = [...hints];
    newHints.splice(idx, 1);
    onHintsChange(newHints);
  };

  // ── Image remove helpers ──
  const removeSavedImage = async (index: number) => {
    const url = images[index];
    // Xóa asset thật khỏi course assets nếu là asset URL
    if (url && courseId && (url.includes('/asset-v1:') || url.includes('/c4x/'))) {
      try {
        const parts = url.split('/');
        const assetKey = decodeURIComponent(parts[parts.length - 1] || '');
        if (assetKey) {
          await deleteCourseAsset(courseId, assetKey);
        }
      } catch (err) {
        console.warn('Failed to delete course asset:', err);
      }
    }
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const removePendingFile = (index: number) => {
    const pf = pendingFiles[index];
    if (pf) URL.revokeObjectURL(pf.previewUrl);
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  const youtubeId = extractYoutubeId(videoUrl);

  // ── Tổng hợp danh sách ảnh: saved + pending (chỉ để hiển thị) ──
  const allImagePreviews = [
    ...images.map((url, i) => ({ type: 'saved' as const, url, index: i })),
    ...pendingFiles.map((pf, i) => ({ type: 'pending' as const, url: pf.previewUrl, index: i })),
  ];

  return (
    <div className="space-y-6">
      {/* ── Header: Tên hiển thị (giống ProblemEditor) ── */}
      <div className="flex items-end justify-between border-b pb-4">
        <div className="w-1/2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 tracking-tight">Tên hiển thị</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              value={displayName}
              onChange={e => onDisplayNameChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── 2-column layout (giống ProblemEditor) ── */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 space-y-8">
          {/* Câu hỏi */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">Câu hỏi</h3>
            </div>
            <RichTextEditor
              content={questionHtml}
              onChange={onQuestionChange}
              minHeight="min-h-[120px]"
            />
          </div>

          {/* Giải thích */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">Giải thích (Đáp án)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Cung cấp lời giải chi tiết sau khi học viên trả lời đúng</p>
            </div>
            <RichTextEditor
              content={explanationHtml}
              onChange={onExplanationChange}
              minHeight="min-h-[120px]"
            />
          </div>

          {/* ── Media section ── */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">Hình ảnh đính kèm</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upload ảnh từ Course Assets. 1 ảnh hiển thị đơn, từ 2 ảnh trở lên sẽ là carousel.
              </p>
            </div>

            {allImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {allImagePreviews.map((item, idx) => (
                  <div key={`${item.type}-${item.index}`} className="group relative rounded-lg overflow-hidden border border-border bg-muted/30 aspect-video">
                    <img src={item.url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => item.type === 'saved' ? removeSavedImage(item.index) : removePendingFile(item.index)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-destructive/90 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="absolute bottom-1 left-1.5 flex gap-1">
                      <span className="text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      {item.type === 'pending' && (
                        <span className="text-[10px] font-bold bg-amber-500/90 text-white px-1.5 py-0.5 rounded">
                          Chưa lưu
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-1">
              <Button
                variant="ghost"
                className="text-sm font-semibold pl-2 hover:bg-primary/5 hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Thêm ảnh
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Video YouTube */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">Video YouTube (tùy chọn)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Nhập link YouTube để nhúng video vào bài trắc nghiệm</p>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Video className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm font-mono focus:ring-2 focus:ring-ring focus:outline-none"
                value={videoUrl}
                onChange={e => onVideoUrlChange(e.target.value)}
                placeholder="https://youtube.com/watch?v=... hoặc để trống"
              />
            </div>
            {youtubeId && youtubeId.length === 11 && (
              <div className="mt-2 aspect-video w-full max-w-sm rounded-lg overflow-hidden bg-black border border-border">
                <iframe
                  key={youtubeId}
                  width="100%" height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                  title="YouTube Preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Đáp án — clone chính xác từ ProblemEditor (multiplechoiceresponse variant) */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold">Danh sách đáp án</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhập các đáp án bên dưới và đánh dấu vào đáp án đúng.
              </p>
            </div>

            <div className="space-y-3 p-1">
              {choices.map((choice, i) => (
                <div key={choice.id} className="flex gap-4 items-start group">
                  <div className="pt-[14px]">
                    <input
                      type="radio"
                      name="correct-answer"
                      checked={choice.correct}
                      onChange={() => handleUpdateChoice(choice.id, { correct: true })}
                      className="w-5 h-5 rounded-full border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                  </div>
                  <div className="pt-[15px] font-semibold w-5 text-center text-[15px] text-muted-foreground shrink-0">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <div className="flex-1">
                    <RichTextEditor
                      content={choice.html}
                      onChange={val => handleUpdateChoice(choice.id, { html: val })}
                      minHeight="min-h-[44px]"
                      hideToolbar={true}
                    />
                  </div>
                  <div className="pt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteChoice(choice.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <Button variant="ghost" className="text-sm font-semibold pl-2 hover:bg-primary/5 hover:text-primary" onClick={handleAddChoice}>
                  <Plus className="w-4 h-4 mr-2" /> Thêm lựa chọn
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Hints sidebar (clone ProblemEditor) */}
        <div className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
            <label className="text-sm font-semibold text-primary">Gợi ý</label>
            <div className="space-y-2">
              {hints.map((hint, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={hint}
                    onChange={e => handleUpdateHint(i, e.target.value)}
                  />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteHint(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full text-sm font-semibold hover:bg-primary/5 hover:text-primary mt-1" onClick={handleAddHint}>
              <Plus className="w-4 h-4 mr-2" /> Thêm gợi ý
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
