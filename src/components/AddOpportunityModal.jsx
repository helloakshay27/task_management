import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { X } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import SelectBox from './SelectBox';
import { useDispatch, useSelector } from 'react-redux';
import { fetchKanbanTasks } from '@/redux/slices/taskSlice';
import { fetchProjects } from '@/redux/slices/projectSlice';
import { fetchMilestone } from '@/redux/slices/milestoneSlice';
import axios from 'axios';
import { baseURL } from '../../apiDomain';
import toast from 'react-hot-toast';
import { fetchUsers } from '@/redux/slices/userSlice';
import { Mention, MentionsInput } from 'react-mentions';
import { fetchActiveTags } from '@/redux/slices/tagsSlice';

const Attachments = ({ attachments, setAttachments }) => {
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        if (!selectedFiles?.length) return;

        const newFiles = [...files, ...selectedFiles];
        setFiles(newFiles);
        setAttachments([...attachments, ...selectedFiles]);
    };

    const handleRemoveFile = (index) => {
        const updatedFiles = [...files];
        updatedFiles.splice(index, 1);
        setFiles(updatedFiles);

        const updatedAttachments = [...attachments];
        updatedAttachments.splice(index, 1);
        setAttachments(updatedAttachments);
    };

    const isImage = (file) => file.type.startsWith('image/');
    const getFileUrl = (file) => URL.createObjectURL(file);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center border h-[45px] px-3 rounded-md">
                <span className="text-[14px] text-gray-500">
                    {files?.length === 0 && <i>No Documents Attached</i>}
                </span>
                <button
                    type="button"
                    className="bg-[#C72030] h-[30px] w-[100px] text-white text-sm rounded"
                    onClick={handleAttachFile}
                >
                    Attach Files
                </button>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
            {files?.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-2">
                    {files.map((file, index) => (
                        <div key={index} className="relative w-[80px] h-[80px] border rounded-md">
                            <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full w-5 h-5 text-lg flex items-center justify-center shadow-lg"
                                title="Remove"
                            >
                                ×
                            </button>
                            {isImage(file) ? (
                                <img
                                    src={getFileUrl(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="text-xs text-gray-800 px-2 py-1 h-full flex items-center justify-center bg-gray-100">
                                    📄 {file.name}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AddOpportunityModal = ({ isModalOpen, setIsModalOpen }) => {
    const addTaskModalRef = useRef(null);
    const dispatch = useDispatch();
    const token = localStorage.getItem('token');

    const {
        fetchProjects: projects,
        loading: loadingProjects,
        error: projectsFetchError,
    } = useSelector((state) => state.fetchProjects || { projects: [], loading: false, error: null });

    const {
        fetchMilestone: milestone,
        loading: loadingMilestone,
        error: milestoneFetchError,
    } = useSelector(
        (state) => state.fetchMilestone || { milestone: [], loading: false, error: null }
    );

    const {
        fetchKanbanTasks: tasks,
        loading: loadingTasks,
        error: tasksFetchError,
    } = useSelector(
        (state) => state.fetchKanbanTasks || { fetchKanbanTasks: [], loading: false, error: null }
    );

    const { fetchUsers: users } = useSelector(
        (state) => state.fetchUsers || { users: [], loading: false, error: null }
    );

    const { fetchActiveTags: tags } = useSelector(
        (state) => state.fetchActiveTags || { fetchActiveTags: [], loading: false, error: null }
    );

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [projectOptions, setProjectOptions] = useState([]);
    const [milestoneOptions, setMilestoneOptions] = useState([]);
    const [_taskOptions, _setTaskOptions] = useState([]);
    const [_subtaskOptions, _setSubtaskOptions] = useState([]);
    const [newIssuesProjectId, _setNewIssuesProjectId] = useState('');
    const [newIssuesMilestoneId, setNewIssuesMilestoneId] = useState('');
    const [newIssuesTaskId, setNewIssuesTaskId] = useState('');
    const [_newIssuesSubtaskId, _setNewIssuesSubtaskId] = useState('');
    const [isSubmitting] = useState(false);
    const [responsiblePersone, setResponsiblePersone] = useState('');

    useEffect(() => {
        dispatch(fetchUsers({ token }));
        dispatch(fetchActiveTags({ token }));
    }, [dispatch, token]);

    useGSAP(() => {
        if (isModalOpen) {
            gsap.fromTo(
                addTaskModalRef.current,
                { x: '100%' },
                { x: '0%', duration: 0.5, ease: 'power3.out' }
            );
        }
    }, [isModalOpen]);

    const closeModal = () => {
        gsap.to(addTaskModalRef.current, {
            x: '100%',
            duration: 0.5,
            ease: 'power3.in',
            onComplete: () => setIsModalOpen(false),
        });
    };

    useEffect(() => {
        if (!loadingMilestone && milestoneOptions?.length > 0 && !milestoneFetchError) {
            if (newIssuesProjectId) dispatch(fetchKanbanTasks({ projectId: newIssuesProjectId, token }));
            setNewIssuesTaskId('');
            _setTaskOptions([]);
            // Clear subtask options and selection when milestone changes
            _setNewIssuesSubtaskId('');
            _setSubtaskOptions([]);
        }
    }, [dispatch, loadingMilestone, milestoneFetchError, newIssuesProjectId, milestoneOptions]);

    useEffect(() => {
        dispatch(fetchKanbanTasks({ id: '', token }));
    }, [dispatch]);

    useEffect(() => {
        if (!loadingTasks && !tasksFetchError && tasks?.length > 0) {
            _setTaskOptions(
                tasks.map((t) => ({
                    value: t.id,
                    label: t.title,
                }))
            );
        }
    }, [tasks, loadingTasks, tasksFetchError]);

    // New effect to handle subtask options when task is selected
    useEffect(() => {
        if (newIssuesTaskId && tasks?.length > 0) {
            const selectedTask = tasks.find((t) => t.id === newIssuesTaskId);
            if (
                selectedTask &&
                selectedTask.sub_tasks_managements &&
                Array.isArray(selectedTask.sub_tasks_managements) &&
                selectedTask.sub_tasks_managements.length > 0
            ) {
                _setSubtaskOptions(
                    selectedTask.sub_tasks_managements.map((subtask) => ({
                        value: subtask.id,
                        label: subtask.title,
                    }))
                );
            } else {
                _setSubtaskOptions([]);
            }
            // Reset subtask selection when task changes
            _setNewIssuesSubtaskId('');
        } else {
            _setSubtaskOptions([]);
            _setNewIssuesSubtaskId('');
        }
    }, [newIssuesTaskId, tasks]);

    useEffect(() => {
        if (
            newIssuesProjectId &&
            projectOptions?.length > 0 &&
            !loadingProjects &&
            !projectsFetchError
        ) {
            dispatch(fetchMilestone({ id: newIssuesProjectId, token })).unwrap();
            setNewIssuesMilestoneId('');
            setMilestoneOptions([]);
            setNewIssuesTaskId('');
            _setTaskOptions([]);
            // Clear subtask options and selection when project changes
            _setNewIssuesSubtaskId('');
            _setSubtaskOptions([]);
        }
    }, [dispatch, newIssuesProjectId, projectOptions]);

    useEffect(() => {
        if (!loadingProjects && (!Array.isArray(projectOptions) || projectOptions?.length === 0)) {
            dispatch(fetchProjects({ token })).unwrap();
            setProjectOptions(
                projects
                    ? projects.map((project) => ({
                        value: project.id,
                        label: project.title,
                    }))
                    : []
            );
        }
    }, [dispatch, loadingProjects, projectOptions]);

    useEffect(() => {
        if (
            !loadingMilestone &&
            !milestoneFetchError &&
            milestone?.length > 0 &&
            Array.isArray(milestone)
        ) {
            setMilestoneOptions(
                milestone?.map((m) => ({
                    value: m.id,
                    label: m.title,
                }))
            );
        }
    }, [milestone, loadingMilestone, milestoneFetchError]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) {
            toast.error('Please enter title');
            return;
        }
        try {
            const formData = new FormData();
            formData.append('opportunity[title]', title);
            formData.append('opportunity[description]', description);
            // formData.append("opportunity[project_management_id]", newIssuesProjectId);
            // formData.append("opportunity[task_management_id]", newIssuesTaskId);
            // formData.append("opportunity[comment]", comments);
            formData.append('opportunity[responsible_person_id]', responsiblePersone);
            attachments.forEach((file) => {
                formData.append(`opportunity[attachments][]`, file);
            });

            await axios.post(`${baseURL}/opportunities.json`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
            <div
                ref={addTaskModalRef}
                className="bg-white py-6 rounded-lg shadow-lg w-[33%] relative h-full right-0"
            >
                <h3 className="text-[14px] font-medium text-center">Add Opportunities</h3>
                <X className="absolute top-[26px] right-8 cursor-pointer" onClick={closeModal} />

                <hr className="border border-[#E95420] my-4" />

                <form className="pt-2 pb-12 h-full overflow-y-auto" onSubmit={handleSubmit}>
                    <div
                        id="addTask"
                        className="max-w-[90%] mx-auto h-[calc(100%-4rem)] overflow-y-auto pr-3 text-[12px]"
                    >
                        <div className="space-y-2">
                            <label className="block">
                                Title <span className="text-red-600">*</span>
                            </label>
                            <MentionsInput
                                value={title}
                                onChange={(e, newValue) => setTitle(newValue)}
                                placeholder="Type @ to mention users. Type # to mention tags"
                                className="mentions w-full border outline-none border-gray-300 text-sm h-[40px]"
                                style={{
                                    control: {
                                        backgroundColor: '#ffffff',
                                        fontSize: 14,
                                        fontWeight: 'normal',
                                    },
                                    highlighter: {
                                        overflow: 'hidden',
                                    },
                                    input: {
                                        margin: 0,
                                        padding: '8px',
                                        outline: 'none',
                                    },
                                    suggestions: {
                                        list: {
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            fontSize: 14,
                                            zIndex: 100,
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 0,
                                            width: '200px',
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            borderRadius: '4px',
                                            marginBottom: '4px',
                                        },
                                        item: {
                                            padding: '5px 10px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                        },
                                        itemFocused: {
                                            backgroundColor: '#f5f5f5',
                                        },
                                    },
                                }}
                            >
                                <Mention
                                    trigger="@"
                                    data={
                                        users
                                            ? users.map((user) => ({
                                                id: user.id.toString(),
                                                display:
                                                    user.firstname && user.lastname
                                                        ? `${user.firstname} ${user.lastname}`
                                                        : 'Unknown User',
                                            }))
                                            : []
                                    }
                                    markup="@[__display__](__id__)"
                                    displayTransform={(id, display) => `@${display}`}
                                    appendSpaceOnAdd
                                />
                                <Mention
                                    trigger="#"
                                    data={
                                        tags
                                            ? tags.map((tag) => ({
                                                id: tag.id.toString(),
                                                display: tag.name,
                                            }))
                                            : []
                                    }
                                    markup="#[__display__](__id__)"
                                    displayTransform={(id, display) => `#${display}`}
                                    appendSpaceOnAdd
                                />
                            </MentionsInput>
                        </div>
                        {/* <div className="flex items-center justify-between gap-2 mt-4">
                            <div className="w-1/2 flex flex-col justify-between">
                                <label className="block mb-2">Project</label>
                                <SelectBox
                                    options={projectOptions}
                                    value={newIssuesProjectId}
                                    onChange={(selectedValue) => _setNewIssuesProjectId(selectedValue)}
                                    placeholder={"Select Project"}
                                />
                            </div>
                            <div className="w-1/2 flex flex-col justify-between">
                                <label className="block mb-2">
                                    Task
                                </label>
                                <SelectBox
                                    options={taskOptions}
                                    value={newIssuesTaskId}
                                    onChange={(selectedValue) => setNewIssuesTaskId(selectedValue)}
                                    placeholder={"Select Task"}
                                />
                            </div>
                        </div> */}
                        <div className="mt-4 space-y-2 h-[100px]">
                            <label className="block">Description</label>
                            <MentionsInput
                                value={description}
                                onChange={(e, newValue) => setDescription(newValue)}
                                placeholder="Type @ to mention users. Type # to mention tags"
                                className="mentions w-full border outline-none border-gray-300 text-[13px] h-[80px] overflow-y-auto resize-none"
                                style={{
                                    control: {
                                        backgroundColor: '#ffffff',
                                        fontSize: 13,
                                        fontWeight: 'normal',
                                    },
                                    highlighter: {
                                        overflow: 'hidden',
                                    },
                                    input: {
                                        margin: 0,
                                        padding: '8px',
                                        outline: 'none',
                                        height: '100%',
                                    },
                                    suggestions: {
                                        list: {
                                            backgroundColor: 'white',
                                            border: '1px solid #ccc',
                                            fontSize: 14,
                                            zIndex: 100,
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: 0,
                                            width: '200px',
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            borderRadius: '4px',
                                            marginBottom: '4px',
                                        },
                                        item: {
                                            padding: '5px 10px',
                                            borderBottom: '1px solid #eee',
                                            cursor: 'pointer',
                                        },
                                        itemFocused: {
                                            backgroundColor: '#f5f5f5',
                                        },
                                    },
                                }}
                            >
                                <Mention
                                    trigger="@"
                                    data={
                                        users
                                            ? users.map((user) => ({
                                                id: user.id.toString(),
                                                display:
                                                    user.firstname && user.lastname
                                                        ? `${user.firstname} ${user.lastname}`
                                                        : 'Unknown User',
                                            }))
                                            : []
                                    }
                                    markup="@[__display__](__id__)"
                                    displayTransform={(id, display) => `@${display}`}
                                    appendSpaceOnAdd
                                />
                                <Mention
                                    trigger="#"
                                    data={
                                        tags
                                            ? tags.map((tag) => ({
                                                id: tag.id.toString(),
                                                display: tag.name,
                                            }))
                                            : []
                                    }
                                    markup="#[__display__](__id__)"
                                    displayTransform={(id, display) => `#${display}`}
                                    appendSpaceOnAdd
                                />
                            </MentionsInput>
                        </div>
                        {/* <div className="space-y-2 mt-4">
                            <label className="block">
                                Comment
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Comment"
                                className="w-full border h-[40px] outline-none border-gray-300 p-2 text-sm"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                        </div> */}
                        <div className="flex flex-col justify-between mt-4">
                            <label className="block mb-2">
                                Responsible Person <span className="text-red-600">*</span>
                            </label>
                            <SelectBox
                                options={
                                    users
                                        ? users.map((user) => ({
                                            value: user.id,
                                            label: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
                                        }))
                                        : []
                                }
                                value={responsiblePersone}
                                onChange={(selectedValue) => {
                                    setResponsiblePersone(selectedValue);
                                }}
                            />
                        </div>
                        <div className="mt-4 space-y-2">
                            <label>Attachments</label>
                            <Attachments attachments={attachments} setAttachments={setAttachments} />
                        </div>
                        <div className="flex items-center justify-center gap-4 w-full bottom-0 py-3 bg-white mt-10">
                            <button
                                type="submit"
                                className="flex items-center justify-center border-2 text-[black] border-[red] px-4 py-2 w-[100px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddOpportunityModal;
