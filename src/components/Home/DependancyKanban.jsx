import { useEffect, useState } from "react";
import DependancyBoardCard from "../Home/DependancyBoardCard";
import DependancyKanbanBoard from "../Home/DependancyKanbanBoard";
import { useDispatch, useSelector } from 'react-redux';
import {
    createDependancy,
    deleteDependancy,
    fetchTasksOfMilestone,
    updateDependancy,
    taskDetails
} from "../../redux/slices/taskSlice";
import { useParams } from "react-router-dom";

const DependancyKanban = () => {
    const { tid, id } = useParams();
    const token = localStorage.getItem("token");
    const dispatch = useDispatch();

    const { fetchTasksOfMilestone: tasks = [] } = useSelector(state => state.fetchTasksOfMilestone);
    const { taskDetails: task } = useSelector(state => state.taskDetails);

    const [taskData, setTaskData] = useState([]);
    const [parentTask, setParentTask] = useState(null); // local state for parent

    // ✅ Fetch milestone tasks only if it's a main task (no parent)
    useEffect(() => {
        if (task?.milestone_id && !task?.parent_id) {
            dispatch(fetchTasksOfMilestone({ token, id: task.milestone_id }));
        }
    }, [dispatch, token, task?.milestone_id, task?.parent_id]);

    // ✅ If current task has a parent, fetch parent details (locally)
    useEffect(() => {
        const getParentTask = async () => {
            if (task?.parent_id) {
                const res = await dispatch(taskDetails({ token, id: task.parent_id })).unwrap();
                if (res) {
                    setParentTask(res); // store parent locally
                }
                dispatch(taskDetails({ token, id: tid }));
            }
        };
        getParentTask();
    }, [dispatch, token]);

    console.log(task)
    // ✅ Build taskData based on whether it’s a main or subtask
    useEffect(() => {
        // Case 1: Subtask (has parent_id)
        if (task?.parent_id && parentTask?.id) {
            const predecessorIds = (task?.predecessor_task || []).flat();
            const successorIds = (task?.successor_task || []).flat();

            const updatedData = parentTask.sub_tasks_managements.map(t => {
                if (t.id === task.id) {
                    return { ...t, section: "Main Task" };
                } else if (predecessorIds.includes(t.id)) {
                    return { ...t, section: "Predecessor" };
                } else if (successorIds.includes(t.id)) {
                    return { ...t, section: "Successor" };
                } else {
                    return { ...t, section: "List of Tasks" };
                }
            });

            setTaskData(updatedData);
        }

        // Case 2: Main task (no parent)
        else if (tasks.task_managements?.length > 0 && task?.id) {
            const predecessorIds = (task?.predecessor_task || []).flat();
            const successorIds = (task?.successor_task || []).flat();

            const updatedData = tasks.task_managements.map(t => {
                if (t.id === task.id) {
                    return { ...t, section: "Main Task" };
                } else if (predecessorIds.includes(t.id)) {
                    return { ...t, section: "Predecessor" };
                } else if (successorIds.includes(t.id)) {
                    return { ...t, section: "Successor" };
                } else {
                    return { ...t, section: "List of Tasks" };
                }
            });

            setTaskData(updatedData);
        }
    }, [tasks, task, parentTask]);


    console.log(taskData)
    // ✅ Drag & drop handler (unchanged)
    const handleDrop = async (item, newStatus) => {
        const { id: draggedTaskId } = item;

        setTaskData(prev =>
            prev.map(task =>
                task.id === draggedTaskId ? { ...task, section: newStatus } : task
            )
        );

        const dependancyId = task?.task_dependencies?.find(d => d.dependent_task_id === draggedTaskId)?.id;

        if (["Predecessor", "Successor"].includes(newStatus) && task?.id) {
            const payload = {
                task_dependency: {
                    task_id: task.id,
                    dependent_task_id: draggedTaskId,
                    active: true,
                    project_management_id: id,
                    dependence_type: newStatus,
                },
            };

            const predecessorIds = (task?.predecessor_task || []).flat();
            const successorIds = (task?.successor_task || []).flat();

            const alreadyPredecessor = predecessorIds.includes(draggedTaskId);
            const alreadySuccessor = successorIds.includes(draggedTaskId);

            if (alreadyPredecessor || alreadySuccessor) {
                dispatch(updateDependancy({ token, id: dependancyId, payload }));
            } else {
                dispatch(createDependancy({ token, payload }));
            }
        } else if (newStatus === "List of Tasks" && dependancyId) {
            dispatch(deleteDependancy({ token, id: dependancyId }));
        }
    };

    return (
        <div className="min-h-[400px] mx-3 my-3 flex items-start gap-1 max-w-full overflow-x-auto overflow-y-auto flex-nowrap">
            {
                ["List of Tasks", "Predecessor", "Main Task", "Successor"].map(card => {
                    const filteredTasks = taskData.filter(task => task.section === card);
                    const isDropDisabled = card === "Main Task";
                    const dropHandler = isDropDisabled ? () => { } : handleDrop;

                    return (
                        <DependancyKanbanBoard title={card} onDrop={dropHandler} key={card}>
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(task => (
                                    <div key={task.id} className="w-full">
                                        <DependancyBoardCard task={task} draggable={card !== "Main Task"} />
                                    </div>
                                ))
                            ) : (
                                <img src="/draganddrop.svg" alt="svg" className="w-full" />
                            )}
                        </DependancyKanbanBoard>
                    );
                })
            }
        </div>
    );
};

export default DependancyKanban;
