/* eslint-disable no-undef */
import { useEffect, useRef } from 'react';
import axios from 'axios';
import 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { useParams, useNavigate } from 'react-router-dom';
import { baseURL } from '../../../apiDomain';

// Compact styles with smaller bars and outside titles
const ganttStyles = `
    /* Compact row height */
    .gantt_task_row,
    .gantt_row {
        height: 36px !important;
    }
    
    .gantt_task_cell {
        height: 36px !important;
    }
    
    /* Small task bars - keep original colors */
    .gantt_task_line {
        border-radius: 4px !important;
        height: 16px !important;
        margin-top: 10px !important;
    }
    
    .milestone-task .gantt_task_line {
        height: 16px !important;
    }

    .milestone-task .gantt_task_progress_wrapper{
        background-color: #bc977c !important;
    }
    
    .sub-task .gantt_task_line {
        height: 16px !important;
    }

    .sub-task .gantt_task_progress_wrapper{
        background-color: #bc977c !important;
    }
    
    /* Remove text from inside bars */
    .gantt_task_content {
        color: #000 !important;
        width: max-content !important;
        font-size: 9px !important;
        background-color: transparent !important;
        margin-top: -19px !important;
        margin-left: 4px !important;
        height: 20px !important;
        text-align: left !important;
    }

    .gantt_task_progress_wrapper {
        background-color: #bc977c !important;
    }
    
    /* Show text outside bars (above) */
    .gantt_task_text {
        position: absolute !important;
        top: -18px !important;
        left: 0 !important;
        color: #333 !important;
        font-size: 10px !important;
        font-weight: 500 !important;
        white-space: nowrap !important;
        pointer-events: none !important;
    }
    
    /* Compact grid cells */
    .gantt_grid_data .gantt_cell {
        border-right: 1px solid #e0e0e0 !important;
        font-size: 12px !important;
        padding: 4px 8px !important;
        line-height: 28px !important;
    }
    
    .gantt_grid_scale .gantt_grid_head_cell {
        background-color: #f8f9fa !important;
        border-right: 1px solid #e0e0e0 !important;
        font-size: 14px !important;
        padding: 4px 8px !important;
    }
    
    /* Compact scale height */
    .gantt_scale_cell {
        font-size: 11px !important;
        height: 28px !important;
        line-height: 28px !important;
    }
    
    /* Today line */
    .gantt_marker {
        background-color: #ff0000 !important;
        opacity: 0.8 !important;
    }
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = ganttStyles;
  document.head.appendChild(styleSheet);
}

const SprintGantt = () => {
  const ganttContainer = useRef(null);
  const [scale, setScale] = React.useState('week');
  const navigate = useNavigate();

  // Helper function to calculate progress for sprints or tasks
  const calculateProgress = (entityId, tasksData, entityType) => {
    const childType = entityType === 'sprint' ? 'task' : 'sub_task';
    const children = tasksData.filter(
      (task) => task.parent === entityId && task.type === childType
    );

    if (children.length === 0) {
      // If no children, check the entity's own status (for tasks without subtasks)
      if (entityType === 'task') {
        const taskItself = tasksData.find((t) => t.id === entityId);
        if (taskItself && taskItself.status?.toLowerCase() === 'completed') {
          return { total: 1, completed: 1, percentage: 100 };
        }
        return { total: 1, completed: 0, percentage: 0 };
      }
      return { total: 0, completed: 0, percentage: 0 };
    }

    let totalTasks = 0;
    let completedTasks = 0;

    if (entityType === 'sprint') {
      children.forEach((task) => {
        const subTasks = tasksData.filter((st) => st.parent === task.id && st.type === 'sub_task');
        if (subTasks.length > 0) {
          totalTasks += subTasks.length;
          completedTasks += subTasks.filter(
            (st) => st.status?.toLowerCase() === 'completed'
          ).length;
        } else {
          totalTasks += 1;
          if (task.status?.toLowerCase() === 'completed') {
            completedTasks += 1;
          }
        }
      });
    } else if (entityType === 'task') {
      totalTasks = children.length;
      completedTasks = children.filter((st) => st.status?.toLowerCase() === 'completed').length;
    }

    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      total: totalTasks,
      completed: completedTasks,
      percentage: Math.round(percentage * 100) / 100,
    };
  };

  // Helper function to determine sprint status based on tasks
  const calculateSprintStatus = (sprintId, tasksData) => {
    const tasks = tasksData.filter((task) => task.parent === sprintId && task.type === 'task');

    if (tasks.length === 0) {
      return tasksData.find((task) => task.type === 'sprint' && task.id === sprintId)?.status;
    }

    const statuses = tasks.map((task) => task.status?.toLowerCase() || 'open');

    if (statuses.some((status) => status === 'on_hold' || status === 'hold')) {
      return 'on_hold';
    }

    if (statuses.every((status) => status === 'completed')) {
      return 'completed';
    }

    if (statuses.some((status) => status === 'in_progress' || status === 'progress')) {
      return 'in_progress';
    }

    return 'open';
  };

  // Combined handler for all navigation clicks
  useEffect(() => {
    const handleNavigationClick = (e) => {
      const btn = e.target.closest('.gantt-open-task');
      if (btn) {
        const itemId = btn.getAttribute('data-id');
        const itemType = btn.getAttribute('data-type');

        if (itemId && itemType) {
          console.log(`Navigating to ${itemType}:`, itemId);
          if (itemType === 'sprint') {
            navigate(`/sprint/sprintdetails/${itemId}`);
          }
        }
      }
    };

    const container = ganttContainer.current;
    container?.addEventListener('click', handleNavigationClick);

    return () => {
      container?.removeEventListener('click', handleNavigationClick);
    };
  }, [navigate]);

  useEffect(() => {
    console.log('Sprint Gantt useEffect started, scale:', scale);

    // Configure compact row height
    gantt.config.row_height = 36;
    gantt.config.task_height = 16;

    // Columns
    gantt.config.columns = [
      {
        name: 'text',
        label: 'Id',
        tree: true,
        width: 130,
        resize: true,
        template: function (task) {
          if (task.type === 'sprint') {
            return `<span class="gantt-sprint-link" data-id="${task.navigationid}" style="cursor: pointer; font-size: 14px;" title="${task.text}">S-${task.id.split('-')[1]}</span>`;
          }
          return `<span style="cursor: pointer; font-size: 14px;" title="${task.text}">T-${task.id.split('-')[1]}</span>`;
        },
      },
      {
        name: 'text',
        label: 'Sprint / Task Title',
        width: 250,
        resize: true,
        template: function (task) {
          if (task.type === 'sprint') {
            return `<span class="gantt-sprint-link" style="cursor: pointer; font-size: 14px;" title="${task.text}">${task.text}</span>`;
          }
          return `<span style="cursor: pointer; font-size: 14px;" title="${task.text}">${task.text}</span>`;
        },
      },
      {
        name: 'progress',
        label: 'Progress',
        align: 'center',
        width: 100,
        template: function (task) {
          if (task.type === 'sprint' || task.type === 'task') {
            return `${Math.round(task.progress * 100)}%`;
          }
          return '';
        },
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        width: 100,
        template: function (task) {
          const status = task.status;
          return status?.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
        },
      },
      {
        name: 'actions',
        label: 'Actions',
        align: 'center',
        width: 130,
        resize: true,
        template: function (task) {
          const navType = task.type === 'sprint' ? 'sprint' : task.type;
          const titleText = task.type === 'sprint' ? 'View Details' : 'View Details';

          return `
                        <span class="flex items-center justify-center gap-3 mt-2 text-gray-500">
                            <button 
                                class="gantt-open-task" 
                                data-id="${task.navigationid}" 
                                data-type="${navType}"
                                title="${titleText}"
                                style="background: none; border: none; cursor: pointer;"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 14.875H11.5417C12.4257 14.875 13.2736 14.5238 13.8987 13.8987C14.5238 13.2736 14.875 12.4257 14.875 11.5417V9.45833M8 14.875H4.45833C3.57428 14.875 2.72643 14.5238 2.10131 13.8987C1.47619 13.2736 1.125 12.4257 1.125 11.5417V8M8 14.875V10.5C8 9.83696 7.73661 9.20107 7.26777 8.73223C6.79893 8.26339 6.16304 8 5.5 8H1.125M1.125 8V4.45833C1.125 3.57428 1.47619 2.72643 2.10131 2.10131C2.72643 1.47619 3.57428 1.125 4.45833 1.125H6.54167M9.45833 1.125H14.0417C14.2717 1.125 14.48 1.21833 14.6308 1.36917M14.6308 1.36917C14.7871 1.52541 14.875 1.73734 14.875 1.95833V6.54167M14.6308 1.36917L14.0417 1.95833L9.45833 6.54167" stroke="black" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                        </span>
                    `;
        },
      },
    ];

    const weekDateFormatter = gantt.date.date_to_str('%d %M');

    gantt.config.scale_offset_minimal = true;
    gantt.config.fit_tasks = false;
    gantt.config.show_chart = true;
    gantt.config.scroll_size = 20;
    gantt.config.smart_rendering = true;
    gantt.config.smart_scales = true;

    gantt.config.layout = {
      css: 'gantt_container',
      cols: [
        {
          width: 500, // Initial width of the left grid
          min_width: 400, // Optional: prevent collapsing too much
          rows: [{ view: 'grid', scrollX: 'scrollHor', scrollY: 'scrollVer' }],
        },
        { resizer: true, width: 1 }, // 👈 enables draggable separator
        {
          rows: [
            { view: 'timeline', scrollX: 'scrollHor', scrollY: 'scrollVer' },
            { view: 'scrollbar', id: 'scrollHor' },
          ],
        },
        { view: 'scrollbar', id: 'scrollVer' },
      ],
    };

    if (scale === 'week') {
      gantt.config.scales = [
        { unit: 'month', step: 1, format: '%F %Y' },
        {
          unit: 'week',
          step: 1,
          format: function (date) {
            const start = gantt.date.week_start(new Date(date));
            const end = gantt.date.add(start, 6, 'day');
            return weekDateFormatter(start) + ' - ' + weekDateFormatter(end);
          },
        },
        { unit: 'day', step: 1, format: '%j' },
      ];
      gantt.config.scale_height = 90;
      gantt.config.min_column_width = 25;
    } else if (scale === 'month') {
      gantt.config.scales = [
        { unit: 'year', step: 1, format: '%Y' },
        { unit: 'month', step: 1, format: '%F' },
        {
          unit: 'week',
          step: 1,
          format: function (date) {
            const start = gantt.date.week_start(new Date(date));
            return start.getDate();
          },
        },
      ];
      gantt.config.scale_height = 90;
      gantt.config.min_column_width = 40;
    } else if (scale === 'year') {
      gantt.config.scales = [
        { unit: 'year', step: 1, format: '%Y' },
        {
          unit: 'quarter',
          step: 1,
          format: function (date) {
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            return 'Q' + quarter;
          },
        },
        { unit: 'month', step: 1, format: '%M' },
      ];
      gantt.config.scale_height = 90;
      gantt.config.min_column_width = 40;
    }

    const setDateRange = () => {
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 10, 0, 1);
      const maxDate = new Date(today.getFullYear() + 10, 11, 31);

      gantt.config.start_date = minDate;
      gantt.config.end_date = maxDate;
    };

    setDateRange();

    gantt.templates.task_class = function (start, end, task) {
      if (task.type === 'sprint') {
        return 'milestone-task';
      } else if (task.type === 'sub_task') {
        return 'sub-task';
      }
      return 'custom-task';
    };

    gantt.config.types.sprint = 'sprint';
    gantt.config.types.task = 'task';
    gantt.config.types.sub_task = 'sub_task';

    if (ganttContainer.current) {
      // Show task text outside bars (above them)
      gantt.templates.task_text = function (start, end, task) {
        function formatDateRange(start, end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          // Subtract 1 day from end date since we added 1 day for display purposes in Gantt
          endDate.setDate(endDate.getDate() - 1);

          const month = endDate.toLocaleString('en-US', { month: 'short' }); // "Nov"
          const year = endDate.getFullYear();

          return `${startDate.getDate()} - ${endDate.getDate()} ${month} ${year}`;
        }
        return `${formatDateRange(start, end)} | ${task.owner ? task.owner : 'Not assigned'}`;
      };
      gantt.templates.rightside_text = function (start, end, task) {
        return '';
      };

      gantt.init(ganttContainer.current);
    } else {
      console.error('Gantt container not found!');
      return;
    }

    // Fetch data from Sprint API
    const fetchSprints = async () => {
      try {
        const response = await axios.get(`${baseURL}/sprints.json`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        const rawData = response.data;
        console.log('Fetched sprints:', rawData);

        const tasksData = [];
        const linksData = [];
        const taskIds = new Set();
        const navigationIdToGanttIds = {};
        const pendingPredecessors = [];

        function formatDateDMYFromISO(dateStr) {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }

        function formatEndDateDMYFromISO(dateStr) {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          // Add 1 day to include the end date in the Gantt display
          date.setDate(date.getDate() + 1);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        }

        function calculateDuration(startStr, endStr) {
          if (!startStr || !endStr) return 1;
          const startParts = startStr.split('-');
          const endParts = endStr.split('-');
          const start = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
          const end = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);
          if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
          const diffTime = end.getTime() - start.getTime();
          // Since end date is already adjusted by +1 day, we just calculate the difference
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return diffDays > 0 ? diffDays : 1;
        }

        rawData.forEach((item) => {
          const sprintId = `sprint-${item.id}`;
          const formattedStart = item.start_date
            ? formatDateDMYFromISO(item.start_date)
            : formatDateDMYFromISO(new Date().toISOString());
          const formattedEnd = item.end_date
            ? formatEndDateDMYFromISO(item.end_date)
            : formatEndDateDMYFromISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

          tasksData.push({
            navigationid: item.id,
            id: sprintId,
            text: item.name || 'Untitled Sprint',
            start_date: formattedStart,
            end_date: formattedEnd,
            duration:
              formattedStart && formattedEnd ? calculateDuration(formattedStart, formattedEnd) : 1,
            progress: 0.0,
            totalTasks: 0,
            completedTasks: 0,
            status: item.status,
            depends: item.depends_on_id ? `sprint-${item.depends_on_id}` : null,
            type: 'sprint',
            owner: item.sprint_owner_name,
            parent: 0,
            open: true,
          });

          if (item.id) {
            if (!navigationIdToGanttIds[item.id]) {
              navigationIdToGanttIds[item.id] = [];
            }
            navigationIdToGanttIds[item.id].push(sprintId);
          }

          if (item.depends_on_id) {
            linksData.push({
              id: `link-sprint-${item.id}`,
              source: sprintId,
              target: `sprint-${item.depends_on_id}`,
              type: '0',
            });
          }

          // Process sprint tasks
          if (Array.isArray(item.sprint_tasks)) {
            item.sprint_tasks.forEach((task) => {
              const taskId = `task-${task.id}`;
              let uniqueTaskId = taskId;

              if (taskIds.has(taskId)) {
                uniqueTaskId = `task-${task.id}-sprint-${item.id}`;
              }
              taskIds.add(uniqueTaskId);

              const formattedStartTask = task.task_management?.started_at
                ? formatDateDMYFromISO(task.task_management?.started_at)
                : formattedStart;

              const formattedEndTask = task.task_management?.target_date
                ? formatEndDateDMYFromISO(task.task_management?.target_date)
                : formattedEnd;

              const taskDuration =
                formattedStartTask && formattedEndTask
                  ? calculateDuration(formattedStartTask, formattedEndTask)
                  : 1;

              tasksData.push({
                id: uniqueTaskId,
                text: task.task_management?.title || 'Untitled Task',
                start_date: formattedStartTask,
                end_date: formattedEndTask,
                duration: taskDuration,
                progress: 0.0,
                status: task.task_management?.status || 'Open',
                owner: task.task_management?.responsible_person
                  ? task.task_management.responsible_person.name
                  : '',
                parent: sprintId,
                type: 'task',
              });

              // Handle sub_tasks_managements
              if (Array.isArray(task.sub_tasks_managements)) {
                task.sub_tasks_managements.forEach((subTask) => {
                  const subTaskId = `subtask-${subTask.id}`;
                  const formattedStartSubTask = subTask.started_at
                    ? formatDateDMYFromISO(subTask.started_at)
                    : formattedStartTask;

                  const formattedEndSubTask = subTask.target_date
                    ? formatEndDateDMYFromISO(subTask.target_date)
                    : formattedEndTask;

                  const subTaskDuration =
                    formattedStartSubTask && formattedEndSubTask
                      ? calculateDuration(formattedStartSubTask, formattedEndSubTask)
                      : 1;

                  tasksData.push({
                    id: subTaskId,
                    text: subTask.title || 'Untitled Sub-task',
                    start_date: formattedStartSubTask,
                    end_date: formattedEndSubTask,
                    duration: subTaskDuration,
                    progress: 0.0,
                    status: subTask.status || 'Open',
                    owner: subTask.responsible_person ? subTask.responsible_person.name : '',
                    parent: uniqueTaskId,
                    type: 'sub_task',
                  });
                });
              }
            });
          }
        });

        // Calculate progress for all sprints and tasks
        const sprintsToUpdate = [];

        tasksData.forEach((task) => {
          if (task.type === 'sprint') {
            const progressData = calculateProgress(task.id, tasksData, 'sprint');
            task.progress = progressData.percentage / 100;
          } else if (task.type === 'task') {
            const progressData = calculateProgress(task.id, tasksData, 'task');
            task.progress = progressData.percentage / 100;
          }
        });

        sprintsToUpdate.forEach((sprint) => {
          const sprintData = tasksData.find((t) => t.id === sprint);
          if (sprintData) {
            const newStatus = calculateSprintStatus(sprint, tasksData);
            sprintData.status = newStatus;
          }
        });

        console.log('Parsed tasks data:', tasksData);
        console.log('Links data:', linksData);

        gantt.clearAll();

        const validTasks = tasksData.filter((task) => {
          if (!task.id || !task.text) {
            console.warn('Invalid task found:', task);
            return false;
          }
          return true;
        });

        console.log('Valid tasks to render:', validTasks.length);

        try {
          gantt.parse({
            data: validTasks,
            links: linksData,
          });

          // Force refresh and fit to screen
          gantt.render();

          setTimeout(() => {
            gantt.render();
          }, 100);

          console.log('Sprint Gantt chart rendered successfully');
        } catch (error) {
          console.error('Error parsing sprint gantt data:', error);
          console.log('Failed data:', { data: validTasks, links: linksData });
        }
      } catch (error) {
        console.error('Error loading sprints:', error);
      }
    };

    fetchSprints();

    let updateTimeout = null;
    let isUpdating = false;

    function formatDateToISO(date) {
      if (!date) return null;
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function formatEndDateToISO(date) {
      if (!date) return null;
      const d = new Date(date);
      // Subtract 1 day since we added 1 day for display purposes
      d.setDate(d.getDate() - 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function updateParentSprintStatus(sprintId) {
      const allTasks = [];
      gantt.eachTask((task) => {
        allTasks.push(task);
      });

      const newStatus = calculateSprintStatus(sprintId, allTasks);
      const sprint = gantt.getTask(sprintId);

      if (sprint && sprint.status !== newStatus) {
        console.log(`Updating sprint ${sprintId} status from ${sprint.status} to ${newStatus}`);

        sprint.status = newStatus;
        gantt.updateTask(sprintId);

        const entityId = sprintId.replace('sprint-', '');
        const payload = {
          sprint: {
            status: newStatus,
          },
        };

        axios
          .put(`${baseURL}/sprints/${entityId}.json`, payload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          .then((response) => {
            console.log('Sprint status updated successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error updating sprint status:', error);
          });
      }
    }

    function handleTaskUpdate(taskId, task) {
      if (isUpdating) {
        console.log('Update already in progress, skipping...');
        return;
      }

      let entityType = '';
      let entityId = '';

      if (taskId.startsWith('sprint-')) {
        entityType = 'sprint';
        entityId = taskId.replace('sprint-', '');
      } else if (taskId.startsWith('task-')) {
        entityType = 'task';
        entityId = taskId.replace('task-', '').split('-sprint-')[0];
      } else if (taskId.startsWith('subtask-')) {
        entityType = 'subtask';
        entityId = taskId.replace('subtask-', '');
      }

      if (entityType === 'sprint') {
        isUpdating = true;

        const payload = {
          sprint: {
            name: task.text,
            start_date: formatDateToISO(task.start_date),
            end_date: formatEndDateToISO(task.end_date),
            duration: task.duration,
            status: task.status,
          },
        };

        if (task.owner) {
          payload.sprint.sprint_owner_name = task.owner;
        }

        if (task.depends && task.depends.startsWith('sprint-')) {
          payload.sprint.depends_on_id = parseInt(task.depends.replace('sprint-', ''));
        }

        console.log('Sending sprint update:', payload);

        axios
          .put(`${baseURL}/sprints/${entityId}.json`, payload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          .then((response) => {
            console.log('Sprint updated successfully:', response.data);
          })
          .catch((error) => {
            console.error('Error updating sprint:', error);
          })
          .finally(() => {
            isUpdating = false;
          });
      }
    }

    const taskUpdateHandler = gantt.attachEvent('onAfterTaskUpdate', function (taskId, task) {
      console.log('Task update event triggered for:', taskId);

      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      updateTimeout = setTimeout(() => {
        console.log('Processing update for task:', taskId);
        handleTaskUpdate(taskId, task);
      }, 1000);
    });

    gantt.attachEvent('onAfterLinkAdd', function (id, link) {
      console.log('Link added:', link);

      const sourceId = link.source;
      const targetId = link.target;

      if (targetId.startsWith('sprint-')) {
        const sprintId = targetId.replace('sprint-', '');
        const dependsOnId = sourceId.startsWith('sprint-')
          ? parseInt(sourceId.replace('sprint-', ''))
          : null;

        if (dependsOnId) {
          const payload = {
            sprint: {
              depends_on_id: dependsOnId,
            },
          };

          axios
            .put(`${baseURL}/sprints/${sprintId}.json`, payload, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            })
            .then((response) => {
              console.log('Sprint dependency updated:', response.data);
            })
            .catch((error) => {
              console.error('Error updating sprint dependency:', error);
            });
        }
      }
    });

    const linkDeleteHandler = gantt.attachEvent('onAfterLinkDelete', function (id, link) {
      console.log('Link deleted:', link);

      const targetId = link.target;

      if (targetId.startsWith('sprint-')) {
        const sprintId = targetId.replace('sprint-', '');

        const payload = {
          sprint: {
            depends_on_id: null,
          },
        };

        axios
          .put(`${baseURL}/sprints/${sprintId}.json`, payload, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          })
          .then((response) => {
            console.log('Sprint dependency removed:', response.data);
          })
          .catch((error) => {
            console.error('Error removing sprint dependency:', error);
          });
      }
    });

    return () => {
      console.log('Cleaning up sprint gantt');

      if (taskUpdateHandler) {
        gantt.detachEvent(taskUpdateHandler);
      }
      if (linkDeleteHandler) {
        gantt.detachEvent(linkDeleteHandler);
      }

      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      if (gantt && gantt.clearAll) {
        gantt.clearAll();
      }
    };
  }, [scale, calculateSprintStatus]);

  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <div className="flex justify-end mb-2 me-4">
        <select
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          className="border rounded p-1"
        >
          <option value="week">Week View</option>
          <option value="month">Month View</option>
          <option value="year">Year View</option>
        </select>
      </div>
      <div
        ref={ganttContainer}
        style={{
          minWidth: '1200px',
          height: '600px',
          position: 'relative',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};

export default SprintGantt;
