import { fetchSpirintById, fetchSpirints, putSprint } from '@/redux/slices/spirintSlice';
import { changeTaskStatus, fetchKanbanTasksOfProject } from '@/redux/slices/taskSlice';
import {
  CalendarDays,
  Circle,
  CircleCheck,
  GripHorizontal,
  Play,
  Square,
  Timer,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import TaskCard from '../Task/TaskCard';
import TaskSubCard from '../Task/TaskSubCard';
import { sprintTitle } from '@/data/Data';
import Boards from '../Boards';
import { debounce } from 'lodash';

const getColor = (index) => {
  const colors = ['#F9C863', '#B4EB77', '#B7E0D4', '#B3B3FF', '#D1A1FF', '#D9B1FF', '#FF9FBF'];
  return colors[index % colors.length];
};

const ItemTypes = {
  TASK: 'TASK',
  SUBTASK: 'SUBTASK',
};

const SprintsBoardSection = ({ selectedProject }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const token = localStorage.getItem('token');

  const { fetchSpirintById: sprint } = useSelector((state) => state.fetchSpirintById);

  const [selectedSprint, setSelectedSprint] = useState(null);
  const [tasksOfSelectedProject, setTasksOfSelectedProject] = useState([]);
  const [sprintBoardTasks, setSprintBoardTasks] = useState([]);
  const [countdown, setCountdown] = useState('00d:00h:00m:00s');
  const [subCardVisibility, setSubCardVisibility] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log(sprintBoardTasks);

  const contributors = selectedSprint?.contributors || ['S', 'A', 'B', 'M', 'K', 'D', 'CB'];

  useEffect(() => {
    if (sprint) {
      setSelectedSprint(sprint);
      setSprintBoardTasks(sprint?.sprint_tasks);
    }
  }, [sprint]);

  const toggleSubCard = useCallback((taskId) => {
    setSubCardVisibility((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  }, []);

  useEffect(() => {
    dispatch(fetchSpirintById({ token, id }));
  }, [dispatch, id]);

  useEffect(() => {
    const getTasks = async () => {
      try {
        const response = await dispatch(
          fetchKanbanTasksOfProject({
            token,
            id: selectedProject === 'All' ? '' : selectedProject.id,
          })
        ).unwrap();
        setTasksOfSelectedProject(response);
      } catch (error) {
        console.log(error);
      }
    };

    getTasks();
  }, [selectedProject]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.TASK, ItemTypes.SUBTASK],
    drop:
      selectedSprint?.status === 'stopped'
        ? (item) => {
            handleDrop(item, 'sprint');
          }
        : undefined,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const debouncedUpdateTaskField = useCallback(
    debounce(async (taskId, fieldName, newValue, isSubtask = false, parentTaskId = null) => {
      try {
        await dispatch(
          changeTaskStatus({
            token,
            id: taskId,
            payload: { [fieldName]: newValue },
            isSubtask,
            parentTaskId,
          })
        ).unwrap();
      } catch (error) {
        console.error(`Task update failed for ${taskId}:`, error);
        dispatch(fetchKanbanTasksOfProject({ token, id: selectedProject.id }));
      }
    }, 300),
    [dispatch]
  );

  const updateTaskDataField = useCallback((taskId, fieldName, newValue) => {
    let changed = false;

    // Update sprintBoardTasks if the task is in the sprint board
    setSprintBoardTasks((prev) => {
      const updated = prev.map((task) => {
        if (task.id === taskId) {
          if (task[fieldName] === newValue) return task;
          console.log(`Updating sprint task ${taskId} with ${fieldName}: ${newValue}`);
          changed = true;
          return { ...task, [fieldName]: newValue };
        }
        if (task.sub_tasks_managements) {
          const updatedSubtasks = task.sub_tasks_managements.map((subtask) => {
            if (subtask.id === taskId && subtask[fieldName] !== newValue) {
              console.log(`Updating sprint subtask ${taskId} with ${fieldName}: ${newValue}`);
              changed = true;
              return { ...subtask, [fieldName]: newValue };
            }
            return subtask;
          });
          if (changed) {
            return { ...task, sub_tasks_managements: updatedSubtasks };
          }
        }
        return task;
      });
      return changed ? updated : prev;
    });

    // Update taskData if the task is not in the sprint board
    setTasksOfSelectedProject((prev) => {
      const updated = prev.map((task) => {
        if (task.id === taskId) {
          if (task[fieldName] === newValue) return task;
          console.log(`Updating task ${taskId} with ${fieldName}: ${newValue}`);
          changed = true;
          return { ...task, [fieldName]: newValue };
        }
        if (task.sub_tasks_managements) {
          const updatedSubtasks = task.sub_tasks_managements.map((subtask) => {
            if (subtask.id === taskId && subtask[fieldName] !== newValue) {
              console.log(`Updating subtask ${taskId} with ${fieldName}: ${newValue}`);
              changed = true;
              return { ...subtask, [fieldName]: newValue };
            }
            return subtask;
          });
          if (changed) {
            return { ...task, sub_tasks_managements: updatedSubtasks };
          }
        }
        return task;
      });
      if (!changed) {
        console.warn(`No task or subtask found with id ${taskId}`);
      }
      return changed ? updated : prev;
    });
  }, []);

  const handleDrop = useCallback(
    async (item, newStatus) => {
      const { type, id: taskId, fromTaskId } = item;

      if (type === 'TASK' || type === 'SUBTASK') {
        updateTaskDataField(taskId, 'status', newStatus);
      }

      if (newStatus === 'sprint' && (type === 'TASK' || type === 'SUBTASK')) {
        // Find the task or subtask from taskData
        let taskToAdd = tasksOfSelectedProject.find((task) => task.id === taskId);
        if (!taskToAdd && type === 'SUBTASK') {
          taskToAdd = tasksOfSelectedProject
            .flatMap((task) => task.sub_tasks_managements || [])
            .find((subtask) => subtask.id === taskId);
        }
        if (taskToAdd) {
          // Add to sprintBoardTasks
          setSprintBoardTasks((prev) => {
            if (!prev.some((task) => task.id === taskId)) {
              return [{ ...taskToAdd, status: 'sprint' }, ...prev];
            }
            return prev;
          });
          // Remove from taskData
          setTasksOfSelectedProject((prev) =>
            prev
              .filter((task) => task.id !== taskId)
              .map((task) => ({
                ...task,
                sub_tasks_managements: (task.sub_tasks_managements || []).filter(
                  (subtask) => subtask.id !== taskId
                ),
              }))
          );
        }
      } else if (newStatus !== 'sprint' && (type === 'TASK' || type === 'SUBTASK')) {
        // Move from sprintBoardTasks back to taskData
        let taskToRemove = sprintBoardTasks.find((task) => task.id === taskId);
        if (!taskToRemove && type === 'SUBTASK') {
          taskToRemove = sprintBoardTasks
            .flatMap((task) => task.sub_tasks_managements || [])
            .find((subtask) => subtask.id === taskId);
        }
        if (taskToRemove) {
          setTasksOfSelectedProject((prev) => [...prev, { ...taskToRemove, status: newStatus }]);
          setSprintBoardTasks((prev) =>
            prev
              .filter((task) => task.id !== taskId)
              .map((task) => ({
                ...task,
                sub_tasks_managements: (task.sub_tasks_managements || []).filter(
                  (subtask) => subtask.id !== taskId
                ),
              }))
          );
        }
      }

      if (newStatus !== 'sprint') {
        debouncedUpdateTaskField(taskId, 'status', newStatus, type === 'SUBTASK', fromTaskId);
      }

      // Update sprint with task IDs
      const sprintTaskIds = sprintBoardTasks
        .map((task) => task.id)
        .filter((taskId) => !item || taskId !== item.id); // Exclude the current item if it's being removed
      if (newStatus === 'sprint' && (type === 'TASK' || type === 'SUBTASK')) {
        if (!sprintTaskIds.includes(taskId)) {
          sprintTaskIds.push(taskId);
        }
      }

      if ((type === 'TASK' || type === 'SUBTASK') && sprintTaskIds.length > 0) {
        const payload = {
          sprint: {
            project_id: selectedProject.id,
          },
          task_ids: sprintTaskIds,
        };

        try {
          await dispatch(putSprint({ token, id, payload })).unwrap();
        } catch (error) {
          console.error('Failed to update sprint:', error);
        }
      }
    },
    [
      tasksOfSelectedProject,
      sprintBoardTasks,
      debouncedUpdateTaskField,
      selectedSprint,
      id,
      dispatch,
      selectedProject,
    ]
  );

  const handleIconClick = useCallback(
    debounce(async (newStatus) => {
      if (!id) {
        return;
      }
      const payload = { status: newStatus };
      try {
        const response = await dispatch(putSprint({ token, id, payload })).unwrap();
        setSelectedSprint((prev) => ({
          ...prev,
          status: newStatus,
        }));
        if (newStatus === 'stopped' || newStatus === 'completed') {
          setCountdown('00d:00h:00m:00s');
        }
      } catch (error) {
        console.error('Failed to update sprint status:', error);
        dispatch(fetchSpirints({ token }));
      }
    }, 300),
    [id, dispatch]
  );

  const handlePlayClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmStart = () => {
    setIsModalOpen(false);
    handleIconClick('started');
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative">
      {isModalOpen && (
        <ConfirmationModal handleCancel={handleCancel} handleConfirmStart={handleConfirmStart} />
      )}
      <div
        className="h-[80%] mx-3 my-3 flex items-start gap-1 max-w-full overflow-x-auto overflow-y-auto flex-nowrap"
        style={{ height: '75vh' }}
      >
        <div
          className="flex flex-col gap-2 h-full overflow-y-auto no-scrollbar"
          style={{ minWidth: '300px' }}
        >
          <div className="bg-[#DEE6E8] rounded-md px-3 py-4 flex flex-col gap-5 h-full">
            <div className="w-full relative">
              <h3
                className="text-white py-2 px-4 rounded-md text-xs absolute top-0 left-0 z-10"
                style={{
                  backgroundColor: selectedSprint?.status === 'completed' ? 'green' : '#88D760',
                }}
              >
                {selectedSprint?.status === 'completed' ? 'Completed' : 'Active'}
              </h3>
              <div className="absolute top-2 right-2 flex gap-2">
                {selectedSprint && (
                  <>
                    {selectedSprint.status === 'completed' ? (
                      <CircleCheck size={15} color="green" />
                    ) : selectedSprint.status === 'stopped' ? (
                      <button onClick={handlePlayClick} title="Start">
                        <Play size={15} fill="#000" className="cursor-pointer" />
                      </button>
                    ) : (
                      <>
                        <button onClick={() => handleIconClick('stopped')} title="Stop">
                          <Square size={15} fill="#000" className="cursor-pointer" />
                        </button>
                        <button onClick={() => handleIconClick('completed')} title="Complete">
                          <Circle size={15} className="cursor-pointer" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {selectedSprint ? (
              <div className="text-[13px] space-y-3 mt-6 bg-white p-5 pt-2">
                <div className="flex justify-center items-center">
                  <GripHorizontal size={15} fill="#000" className="cursor-pointer" />
                </div>
                <p>
                  <span className="text-[#62bbec] font-medium">S-{selectedSprint.id}</span>{' '}
                  {selectedSprint.name}
                </p>
                <div className="flex items-center gap-2 text-[#B00020]">
                  <CalendarDays size={14} />
                  <span className="text-black">
                    {selectedSprint.start_date} to {selectedSprint.end_date}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#D32F2F]">
                  <User size={14} />
                  <span className="text-black">{sprint?.sprint_owner_name}</span>
                </div>
                <div className="flex items-center gap-2 text-[#029464]">
                  <Timer size={14} />
                  <span className="text-[11px]">{countdown}</span>
                </div>
                <div className="border-t border-gray-300 my-4"></div>
                <div className="flex justify-between items-center">
                  <p className="text-[xs] mb-1">Contributors</p>
                  <div className="flex -space-x-2">
                    {contributors.map((char, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full text-xs flex items-center justify-center border border-white text-black"
                        style={{ backgroundColor: getColor(i) }}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[13px] space-y-3 mt-6 bg-white p-5 pt-2">
                <div className="flex justify-center items-center">
                  <GripHorizontal size={15} fill="#000" className="cursor-pointer" />
                </div>
                <p>
                  <span className="text-[#62bbec] font-medium">No Sprint Selected</span>
                </p>
                <div className="border-t border-gray-300 my-4"></div>
                <div className="flex justify-between items-center">
                  <p className="text-[xs] mb-1">Contributors</p>
                  <div className="flex -space-x-2">
                    {['S', 'A', 'B', 'M', 'K', 'D', 'CB'].map((char, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full text-xs flex items-center justify-center border border-white text-black"
                        style={{ backgroundColor: getColor(i) }}
                      >
                        {char}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div
              ref={selectedSprint?.status === 'stopped' ? drop : null}
              className={`w-full h-max bg-white p-3 shadow-xl space-y-2 mb-2 rounded-md flex flex-col items-center justify-start text-center px-2 text-gray-500 text-sm overflow-y-auto no-scrollbar
              ${
                isOver && canDrop && selectedSprint?.status === 'stopped'
                  ? 'ring-2 ring-blue-400'
                  : ''
              }`}
              style={{ minHeight: 120 }}
            >
              {sprintBoardTasks?.length === 0 &&
              (!selectedSprint?.sprint_tasks || selectedSprint.sprint_tasks.length === 0) ? (
                <span className="text-gray-500 mt-3">
                  Drag from respective statuses
                  <br />
                  and drop your Task here.
                </span>
              ) : (
                <>
                  {sprintBoardTasks?.map((task) => {
                    const taskId = `task-${task.id}`;
                    // Handle both nested (task.task_management) and flat (task) structures
                    const taskData = task.task_management || task;
                    const visibleSubtasks = (task.sub_tasks_managements || []).filter(
                      (subtask) => subtask.status === 'sprint'
                    );
                    return (
                      <div key={`task-${task.id}`} id={taskId} className="w-full my-2">
                        <TaskCard task={taskData} toggleSubCard={() => toggleSubCard(task.id)} />
                        {visibleSubtasks.length > 0 && subCardVisibility[task.id] && (
                          <div className="ml-5 mt-1">
                            {visibleSubtasks.map((subtask) => (
                              <div
                                key={`subtask-${subtask.id}`}
                                id={`subtask-${subtask.id}`}
                                draggable={selectedSprint?.status === 'stopped'}
                                onDragStart={(e) => {
                                  if (selectedSprint?.status !== 'stopped') return;
                                  console.log(
                                    'Dragging subtask:',
                                    subtask.id,
                                    'from task:',
                                    task.id
                                  );
                                  e.dataTransfer.setData(
                                    'application/reactflow',
                                    JSON.stringify({
                                      type: 'SUBTASK',
                                      id: subtask.id,
                                      fromTaskId: task.id,
                                    })
                                  );
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                className="mb-2 cursor-move relative"
                                style={{ pointerEvents: 'auto' }}
                              >
                                <TaskSubCard subtask={subtask} isVisible={true} />
                                <div className="text-[8px] font-medium text-gray-500 mb-1 me-2 pt-1 text-end italic">
                                  Subcard of Task-{task.id}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {sprintTitle.map((card) => {
          const sprintTaskIds = sprint?.sprint_tasks?.map((sprintTask) => sprintTask.task_id) || [];
          const cardStatus = card.title.toLowerCase().replace(' ', '_');
          const filteredTasks = tasksOfSelectedProject.filter((task) => {
            const notInSprint = !sprintTaskIds.includes(task.id);
            const matchesStatus =
              cardStatus === 'active' ? task.status === 'open' : task.status === cardStatus;
            return notInSprint && matchesStatus;
          });

          const filteredSubtasks = tasksOfSelectedProject
            .flatMap((task) =>
              (task.sub_tasks_managements || []).map((subtask) => ({
                ...subtask,
                parentTaskId: task.id,
                parentTaskStatus: task.status,
              }))
            )
            .filter(
              (subtask) =>
                (cardStatus === 'active'
                  ? subtask.status === 'open'
                  : subtask.status === cardStatus) &&
                subtask.status !== subtask.parentTaskStatus &&
                !sprintTaskIds.includes(subtask.id)
            );

          return (
            <Boards
              key={card.id}
              add={card.add}
              color={card.color}
              count={filteredTasks.length + filteredSubtasks.length}
              title={card.title}
              onDrop={(item) => handleDrop(item, cardStatus === 'active' ? 'open' : cardStatus)}
            >
              {filteredTasks.length + filteredSubtasks.length > 0 ? (
                <>
                  {filteredTasks.map((task) => {
                    const taskId = `task-${task.id}`;
                    let dependsOnArr = [];

                    if (Array.isArray(task.predecessor_task)) {
                      dependsOnArr = [
                        ...dependsOnArr,
                        ...task.predecessor_task.flat().filter(Boolean),
                      ];
                    }
                    if (Array.isArray(task.successor_task)) {
                      dependsOnArr = [
                        ...dependsOnArr,
                        ...task.successor_task.flat().filter(Boolean),
                      ];
                    }

                    dependsOnArr = [...new Set(dependsOnArr.filter((id) => id && id !== task.id))];
                    const formattedDependsOn = dependsOnArr.map((dep) => `task-${dep}`);

                    const allLinked = false; // Dependency links not yet configured

                    const visibleSubtasks = (task.sub_tasks_managements || []).filter((subtask) =>
                      cardStatus === 'active'
                        ? subtask.status === 'open'
                        : subtask.status === cardStatus
                    );

                    return (
                      <div key={task.id} id={taskId} className="relative">
                        <TaskCard task={task} toggleSubCard={() => toggleSubCard(task.id)} />
                        {visibleSubtasks.length > 0 && subCardVisibility[task.id] && (
                          <div className="ml-5 mt-1">
                            {visibleSubtasks.map((subtask) => (
                              <div
                                key={`subtask-${subtask.id}`}
                                id={`subtask-${subtask.id}`}
                                draggable
                                onDragStart={(e) => {
                                  console.log(
                                    'Dragging subtask:',
                                    subtask.id,
                                    'from task:',
                                    task.id
                                  );
                                  e.dataTransfer.setData(
                                    'application/reactflow',
                                    JSON.stringify({
                                      type: 'SUBTASK',
                                      id: subtask.id,
                                      fromTaskId: task.id,
                                    })
                                  );
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                className="mb-2 cursor-move relative"
                                style={{ pointerEvents: 'auto' }}
                              >
                                <div className="text-[8px] font-medium text-gray-500 mb-1 me-2 pt-1 text-end italic">
                                  Subcard of Task-{task.id}
                                </div>
                                <TaskSubCard subtask={subtask} isVisible={true} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredSubtasks.map((subtask) => (
                    <div
                      key={`subtask-${subtask.id}`}
                      id={`subtask-${subtask.id}`}
                      draggable
                      onDragStart={(e) => {
                        console.log(
                          'Dragging independent subtask:',
                          subtask.id,
                          'from task:',
                          subtask.parentTaskId
                        );
                        e.dataTransfer.setData(
                          'application/reactflow',
                          JSON.stringify({
                            type: 'SUBTASK',
                            id: subtask.id,
                            fromTaskId: subtask.parentTaskId,
                          })
                        );
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="mb-2 cursor-move relative"
                      style={{ pointerEvents: 'auto' }}
                    >
                      <div className="text-[8px] font-medium text-gray-500 mb-1 me-2 pt-1 text-end italic">
                        Subcard of Task-{subtask.parentTaskId}
                      </div>
                      <TaskSubCard subtask={subtask} isVisible={true} />
                    </div>
                  ))}
                </>
              ) : (
                <img src="/draganddrop.svg" alt="svg" className="w-full" />
              )}
            </Boards>
          );
        })}
      </div>
    </div>
  );
};

export default SprintsBoardSection;

const ConfirmationModal = ({ handleCancel, handleConfirmStart }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-[500px]">
        <div className="flex justify-end p-4">
          <button onClick={handleCancel}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="text-center px-8 pb-6">
          <p className="text-sm text-black">
            Are you sure you want to start this sprint. <br />
            You cannot add or remove tasks from sprint bucket later.
          </p>
        </div>
        <div className="bg-gray-200 py-4 flex justify-center gap-4">
          <button
            onClick={handleConfirmStart}
            className="border border-red-500 text-black px-6 py-2"
          >
            Yes
          </button>
          <button onClick={handleCancel} className="border border-red-500 text-black px-6 py-2">
            No
          </button>
        </div>
      </div>
    </div>
  );
};
