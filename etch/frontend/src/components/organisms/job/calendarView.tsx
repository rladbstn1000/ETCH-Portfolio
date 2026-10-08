import { notifyUser } from "../../../config/experienceText";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { JobItemProps } from "../../atoms/listItem";
import BookmarkSVG from "../../svg/bookmarkSVG";
import { likeApi } from "../../../api/likeApi";
import { useLikedJobs } from "../../../hooks/useLikedItems";
import { useState } from "react";

interface CalendarViewProps {
  jobList: JobItemProps[];
  onEventClick?: (jobId: string) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

function CalendarView({
  jobList,
  onEventClick,
  onDateRangeChange,
  currentDate,
  onDateChange,
}: CalendarViewProps) {
  const { isJobLiked, addLikedJob, removeLikedJob } = useLikedJobs();
  const [bookmarkingJobs, setBookmarkingJobs] = useState<Set<string>>(new Set());

  // 북마크 클릭 핸들러
  const handleBookmarkClick = async (jobId: string, companyName?: string) => {
    const numJobId = Number(jobId);
    const isLiked = isJobLiked(numJobId);
    
    if (bookmarkingJobs.has(jobId)) return;
    
    try {
      setBookmarkingJobs(prev => new Set([...prev, jobId]));
      
      if (isLiked) {
        // 이미 좋아요한 경우 - 삭제
        await likeApi.jobs.removeLike(numJobId);
        removeLikedJob(numJobId);
        notifyUser(`${companyName || '채용공고'}가 관심 공고에서 삭제되었습니다!`);
      } else {
        // 좋아요하지 않은 경우 - 추가
        await likeApi.jobs.addLike(numJobId);
        addLikedJob(numJobId);
        notifyUser(`${companyName || '채용공고'}가 관심 공고로 등록되었습니다!`);
      }
    } catch (error: any) {
      console.error("관심 공고 처리 실패:", error);
      if (error.response?.data?.message === "이미 좋아요를 누른 콘텐츠입니다.") {
        notifyUser("이미 관심 공고로 등록된 채용공고입니다.");
      } else {
        notifyUser(`관심 공고 ${isLiked ? '삭제' : '등록'}에 실패했습니다. 다시 시도해주세요.`);
      }
    } finally {
      setBookmarkingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };
  const convertJobsToEvents = (jobs: JobItemProps[]) => {
    const events = [];

    for (const job of jobs) {
      // 태그들을 조합 (배열이 아닐 수 있으므로 안전하게 처리)
      const safeJobCategories = Array.isArray(job.jobCategories)
        ? job.jobCategories
        : [];
      const safeIndustries = Array.isArray(job.industries)
        ? job.industries
        : [];
      const safeRegions = Array.isArray(job.regions) ? job.regions : [];
      const allTags = [
        ...safeJobCategories,
        ...safeIndustries,
        job.workType,
        job.educationLevel,
      ].filter(Boolean);

      const isLiked = isJobLiked(Number(job.id));
      
      // 시작일 이벤트
      events.push({
        id: `${job.id}-start`,
        title: job.companyName,
        start: job.openingDate,
        allDay: true,
        backgroundColor: "#ffffff",
        borderColor: "#3b82f6",
        textColor: "#1f2937",
        display: "block",
        className: "event-start",
        extendedProps: {
          type: "start",
          companyName: job.companyName,
          regions: safeRegions,
          tags: allTags,
          openingDate: job.openingDate,
          expirationDate: job.expirationDate,
          originalId: job.id,
          isLiked,
        },
      });

      // 마감일 이벤트
      events.push({
        id: `${job.id}-end`,
        title: job.companyName,
        start: job.expirationDate,
        allDay: true,
        backgroundColor: "#ffffff",
        borderColor: "#dc2626",
        textColor: "#1f2937",
        display: "block",
        className: "event-end",
        extendedProps: {
          type: "end",
          companyName: job.companyName,
          regions: safeRegions,
          tags: allTags,
          openingDate: job.openingDate,
          expirationDate: job.expirationDate,
          originalId: job.id,
          isLiked,
        },
      });
    }

    return events;
  };

  const handleEventClick = (clickInfo: any) => {
    if (onEventClick) {
      const originalId = clickInfo.event.extendedProps.originalId;
      onEventClick(originalId);
    }
  };

  const handleDatesSet = (dateInfo: any) => {
    // 현재 달력의 중심 날짜를 상위 컴포넌트에 전달 (날짜 상태 유지용)
    if (onDateChange) {
      const centerDate = new Date(dateInfo.view.currentStart);
      centerDate.setDate(15); // 달의 중간 날짜로 설정
      onDateChange(centerDate);
    }
    
    // dateInfo.start: 달력에서 보이는 첫 번째 날짜 (7월 27일)
    // dateInfo.end: 달력에서 보이는 마지막 날짜 + 1 (9월 7일)
    const startDate = new Date(dateInfo.start);
    const endDate = new Date(dateInfo.end);
    endDate.setDate(endDate.getDate() - 1); // end는 다음날이므로 1일 빼기


    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const { event } = eventInfo;
    const { type, companyName, originalId, isLiked } = event.extendedProps;
    const isBookmarking = bookmarkingJobs.has(originalId);

    return (
      <div className="flex items-center w-full px-1 relative">
        <div className="flex items-center space-x-1 flex-1 min-w-0 pr-5">
          <span className={`px-1.5 py-0.5 text-xs font-medium rounded flex-shrink-0 ${
            type === "start" 
              ? "bg-blue-100 text-blue-700" 
              : "bg-red-100 text-red-700"
          }`}>
            {type === "start" ? "시작" : "마감"}
          </span>
          <span className="text-xs truncate min-w-0">{companyName}</span>
        </div>
        <button
          className={`absolute right-1 w-4 h-4 flex-shrink-0 transition-opacity ${
            isBookmarking 
              ? "opacity-30 cursor-not-allowed" 
              : isLiked 
                ? "text-yellow-500 opacity-90 hover:opacity-100" 
                : "opacity-70 hover:opacity-100"
          }`}
          disabled={isBookmarking}
          onClick={(e) => {
            e.stopPropagation();
            handleBookmarkClick(originalId, companyName);
          }}
          title={isLiked ? "관심 공고 삭제" : "관심 공고 등록"}
        >
          {isBookmarking ? (
            <div className="w-4 h-4 animate-spin">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="31.416" strokeDashoffset="31.416">
                  <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                  <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
          ) : (
            <BookmarkSVG filled={isLiked} className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  };

  const events = convertJobsToEvents(jobList);

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <style>{`
          .fc-toolbar-title {
            font-size: 1.2rem !important;
            font-weight: 600 !important;
            color: #111827;
          }
          .fc-button-primary {
            background: #f3f4f6 !important;
            border: 1px solid #d1d5db !important;
            color: #374151 !important;
            border-radius: 6px !important;
            padding: 0.25rem 0.75rem !important;
            font-size: 0.875rem !important;
            font-weight: 500 !important;
            transition: all 0.2s ease !important;
          }
          .fc-button-primary:hover {
            background: #e5e7eb !important;
            border-color: #9ca3af !important;
          }
          .fc-button-primary:focus {
            box-shadow: 0 0 0 2px rgba(0, 125, 252, 0.2) !important;
          }
          .fc-daygrid-day-number {
            color: #374151;
            font-weight: 500;
            padding: 0.25rem;
          }
          .fc-day-today {
            background-color: #ecfdf5 !important;
            border: 1px solid #10b981 !important;
          }
          .fc-event {
            border-radius: 4px !important;
            border-width: 1px !important;
            border-style: solid !important;
            padding: 0.125rem 0.25rem !important;
            margin: 0 !important;
            font-size: 0.7rem !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            height: auto !important;
            min-height: 16px !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
            overflow: hidden !important;
          }
          .fc-event.event-start {
            border-color: #3b82f6 !important;
          }
          .fc-event.event-end {
            border-color: #dc2626 !important;
          }
          .fc-daygrid-day-frame {
            min-height: 140px !important;
            padding: 0.25rem !important;
          }
          .fc-daygrid-day-events {
            padding: 0.125rem !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0.6rem !important;
          }
          .fc-daygrid-event-harness {
            margin: 0 !important;
          }
          .fc-popover {
            display: none !important;
          }
          .fc-more-popover {
            display: none !important;
          }
          .fc-event:hover {
            opacity: 0.9 !important;
          }
          .fc-col-header-cell {
            background: #f9fafb !important;
            padding: 0.5rem 0 !important;
            font-weight: 600 !important;
            color: #6b7280 !important;
            text-transform: uppercase !important;
            font-size: 0.75rem !important;
            letter-spacing: 0.025em !important;
          }
          .fc-theme-standard td,
          .fc-theme-standard th {
            border-color: #e5e7eb !important;
          }
          .fc-toolbar {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 1rem !important;
            position: relative !important;
            gap: 1.5rem !important;
            transform: translateX(15px) !important;
          }
          .fc-toolbar-chunk {
            display: flex !important;
            align-items: center !important;
          }
          .fc-toolbar-chunk:nth-child(3) {
            gap: 0.5rem !important;
          }
        `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={currentDate}
        headerToolbar={{
          left: "prev",
          center: "title",
          right: "next today",
        }}
        events={events}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        height="auto"
        locale="ko"
        buttonText={{
          today: "오늘"
        }}
        displayEventTime={false}
        aspectRatio={1.2}
        eventDisplay="block"
        dayMaxEvents={7}
        moreLinkClick={(info: any) => {

          // 기존 FullCalendar popover 강제로 숨기기
          setTimeout(() => {
            const existingPopovers = document.querySelectorAll(
              ".fc-popover, .fc-more-popover"
            );
            existingPopovers.forEach((popover) => {
              if (popover && popover.parentNode) {
                popover.parentNode.removeChild(popover);
              }
            });
          }, 0);

          // 커스텀 popover 생성
          const popover = document.createElement("div");
          popover.className = "custom-more-popover"; // fc- 클래스명 제거
          popover.style.cssText = `
            position: fixed;
            z-index: 9999;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 12px;
            min-width: 250px;
            max-width: 300px;
          `;

          // 헤더 생성
          const header = document.createElement("div");
          header.style.cssText = `
            font-weight: 600;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
            color: #374151;
          `;
          header.textContent = `${info.date.toLocaleDateString(
            "ko-KR"
          )} 일정 (${info.allSegs.length}개)`;
          popover.appendChild(header);

          // 이벤트 목록 컨테이너
          const eventsContainer = document.createElement("div");
          eventsContainer.style.cssText = `
            max-height: 300px;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
            display: flex;
            flex-direction: column;
            gap: 8px;
          `;

          // 각 이벤트 아이템 생성
          info.allSegs.forEach((seg: any) => {
            const eventEl = document.createElement("div");
            eventEl.style.cssText = `
              padding: 10px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
              display: flex;
              align-items: center;
              position: relative;
              background-color: ${seg.event.backgroundColor || "#f3f4f6"};
              color: ${seg.event.textColor || "#374151"};
              transition: opacity 0.2s;
              border: 1px solid ${seg.event.borderColor || "#e5e7eb"};
            `;

            // 이벤트 제목 부분
            const titleContainer = document.createElement("div");
            titleContainer.style.cssText = `
              flex: 1;
              display: flex;
              align-items: center;
              gap: 4px;
              overflow: hidden;
              min-width: 0;
              padding-right: 20px;
            `;
            
            // 배지 생성
            const badge = document.createElement("span");
            const eventType = seg.event.extendedProps.type;
            badge.style.cssText = `
              display: inline-block;
              padding: 2px 6px;
              font-size: 10px;
              font-weight: 500;
              border-radius: 4px;
              flex-shrink: 0;
              ${eventType === 'start' 
                ? 'background-color: #dbeafe; color: #1d4ed8;'
                : 'background-color: #fed7d7; color: #dc2626;'
              }
            `;
            badge.textContent = eventType === 'start' ? '시작' : '마감';
            
            // 회사명
            const companySpan = document.createElement("span");
            companySpan.style.cssText = `
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 12px;
              min-width: 0;
            `;
            companySpan.textContent = seg.event.extendedProps.companyName;
            
            titleContainer.appendChild(badge);
            titleContainer.appendChild(companySpan);

            // 북마크 버튼 부분
            const bookmarkBtn = document.createElement("button");
            const originalId = seg.event.extendedProps.originalId;
            const eventIsLiked = seg.event.extendedProps.isLiked;
            const isBookmarking = bookmarkingJobs.has(originalId);
            
            bookmarkBtn.style.cssText = `
              position: absolute;
              right: 4px;
              top: 50%;
              transform: translateY(-50%);
              width: 16px;
              height: 16px;
              opacity: ${isBookmarking ? '0.3' : eventIsLiked ? '0.9' : '0.7'};
              background: none;
              border: none;
              cursor: ${isBookmarking ? 'not-allowed' : 'pointer'};
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              border-radius: 2px;
              transition: background-color 0.2s, opacity 0.2s;
              color: ${eventIsLiked ? '#eab308' : 'currentColor'};
            `;
            
            if (isBookmarking) {
              bookmarkBtn.innerHTML = `
                <div style="width: 14px; height: 14px;" class="animate-spin">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                      <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                      <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                </div>
              `;
            } else {
              bookmarkBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" ${eventIsLiked ? 'fill="currentColor"' : 'fill="none"'} stroke="currentColor" stroke-width="${eventIsLiked ? '0' : '2'}" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
                </svg>
              `;
            }
            
            if (!isBookmarking) {
              bookmarkBtn.addEventListener("mouseenter", () => {
                bookmarkBtn.style.opacity = "1";
                bookmarkBtn.style.backgroundColor = "rgba(0, 0, 0, 0.1)";
              });
              bookmarkBtn.addEventListener("mouseleave", () => {
                bookmarkBtn.style.opacity = eventIsLiked ? "0.9" : "0.7";
                bookmarkBtn.style.backgroundColor = "transparent";
              });
            }
            
            bookmarkBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              if (!isBookmarking) {
                const companyName = seg.event.extendedProps.companyName;
                handleBookmarkClick(originalId, companyName);
              }
            });

            eventEl.appendChild(titleContainer);
            eventEl.appendChild(bookmarkBtn);

            eventEl.addEventListener("mouseenter", () => {
              eventEl.style.opacity = "0.8";
            });
            eventEl.addEventListener("mouseleave", () => {
              eventEl.style.opacity = "1";
            });
            eventEl.addEventListener("click", (e) => {
              // 북마크 버튼 클릭이 아닌 경우에만 이벤트 클릭 처리
              if (
                e.target !== bookmarkBtn &&
                !bookmarkBtn.contains(e.target as Node)
              ) {
                if (onEventClick) {
                  const originalId = seg.event.extendedProps.originalId;
                  onEventClick(originalId);
                }
                if (document.body.contains(popover)) {
                  document.body.removeChild(popover);
                }
              }
            });

            eventsContainer.appendChild(eventEl);
          });

          popover.appendChild(eventsContainer);

          // 닫기 버튼
          const closeBtn = document.createElement("button");
          closeBtn.innerHTML = "✕";
          closeBtn.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: #6b7280;
            padding: 4px;
            border-radius: 4px;
          `;
          closeBtn.addEventListener("click", () => {
            if (document.body.contains(popover)) {
              document.body.removeChild(popover);
            }
          });
          popover.appendChild(closeBtn);

          // 마우스 위치 기준으로 팝오버 위치 설정
          if (
            info.jsEvent &&
            (info.jsEvent as MouseEvent).clientX !== undefined
          ) {
            const mouseEvent = info.jsEvent as MouseEvent;
            const x = mouseEvent.clientX;
            const y = mouseEvent.clientY;
            popover.style.left = `${x}px`;
            popover.style.top = `${y + 10}px`;
          } else {
            // 화면 중앙에 표시
            popover.style.left = "50%";
            popover.style.top = "50%";
            popover.style.transform = "translate(-50%, -50%)";
          }

          document.body.appendChild(popover);

          // 화면 경계 확인 및 조정
          const popoverRect = popover.getBoundingClientRect();
          if (popoverRect.right > window.innerWidth) {
            popover.style.left = `${
              window.innerWidth - popoverRect.width - 10
            }px`;
            popover.style.transform = "none";
          }
          if (popoverRect.bottom > window.innerHeight) {
            const mouseEvent = info.jsEvent as MouseEvent;
            const newTop = mouseEvent?.clientY
              ? mouseEvent.clientY - popoverRect.height - 10
              : window.innerHeight / 2 - popoverRect.height / 2;
            popover.style.top = `${Math.max(10, newTop)}px`;
            popover.style.transform = "none";
          }

          // 외부 클릭시 닫기
          const closeOnOutsideClick = (e: Event) => {
            const target = e.target as Node;
            if (!popover.contains(target)) {
              if (document.body.contains(popover)) {
                document.body.removeChild(popover);
              }
              document.removeEventListener("click", closeOnOutsideClick);
            }
          };
          setTimeout(() => {
            document.addEventListener("click", closeOnOutsideClick);
          }, 100);

          return ""; // string 반환 (빈 문자열)
        }}
        eventContent={renderEventContent}
      />
    </div>
  );
}

export default CalendarView;
