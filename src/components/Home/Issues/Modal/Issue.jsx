import { useEffect, useState, useCallback, useRef } from 'react';
import SelectBox from '../../../SelectBox';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  fetchUserAvailability,
  fetchUserShift,
} from '../../../../redux/slices/userSlice';
import { createIssue, fetchIssue, fetchIssueType } from '../../../../redux/slices/IssueSlice';
import { fetchMilestone } from '../../../../redux/slices/milestoneSlice';
import { fetchKanbanProjects } from '../../../../redux/slices/projectSlice';
import { fetchTargetDateTasks } from '../../../../redux/slices/taskSlice';
import toast from 'react-hot-toast';
import { fetchKanbanTasks } from '../../../../redux/slices/taskSlice';
import gsap from 'gsap';
import { CalendarIcon, X } from 'lucide-react';
import { TaskDatePicker } from '@/components/TaskDatePicker';
import TasksOfDate from '@/components/TasksOfDate';
import { CustomCalender } from '@/components/CustomCalender';
import { DurationPicker } from '@/components/DurationPicker';

const globalPriorityOptions = [
  { value: 2, label: 'Low' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Urgent' },
];

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

const Issues = ({ closeModal }) => {
  const [title, setTitle] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [endDate, setEndDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [type, setType] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIssuesProjectId, setNewIssuesProjectId] = useState('');
  const [newIssuesMilestoneId, setNewIssuesMilestoneId] = useState('');
  const [newIssuesTaskId, setNewIssuesTaskId] = useState('');
  // Add state for subtask ID and subtask options
  const [newIssuesSubtaskId, setNewIssuesSubtaskId] = useState('');
  const [subtaskOptions, setSubtaskOptions] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showCalender, setShowCalender] = useState(false);
  const [showStartCalender, setShowStartCalender] = useState(false);
  const [startDateTasks, setStartDateTasks] = useState([]);
  const [targetDateTasks, setTargetDateTasks] = useState([]);
  const [calendarTaskHours, setCalendarTaskHours] = useState([]);
  const [issueDuration, setIssueDuration] = useState();
  const [totalWorkingHours, setTotalWorkingHours] = useState(0);
  const [dateWiseHours, setDateWiseHours] = useState([]);

  console.log(dateWiseHours);

  const token = localStorage.getItem('token');
  const isSubmittingRef = useRef(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const collapsibleRef = useRef(null);
  const startCollapsibleRef = useRef(null);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const { fetchUsers: users, loading: loadingUsers } = useSelector(
    (state) => state.fetchUsers || { users: [], loading: false, error: null }
  );

  const { fetchUserAvailability: userAvailability = [] } = useSelector(
    (state) => state.fetchUserAvailability || { fetchUserAvailability: [], loading: false }
  );

  const { fetchUserShift: shift = {} } = useSelector(
    (state) => state.fetchUserShift || { fetchUserShift: {}, loading: false }
  );

  const {
    fetchKanbanProjects: projects,
    loading: loadingProjects,
    error: projectsFetchError,
  } = useSelector(
    (state) => state.fetchKanbanProjects || { projects: [], loading: false, error: null }
  );

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

  const [projectOptions, setProjectOptions] = useState([]);
  const [milestoneOptions, setMilestoneOptions] = useState([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState([]);
  const [taskOptions, setTaskOptions] = useState([]);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchUsers({ token }));
  }, [dispatch]);

  // Animate when showDatePicker changes
  useEffect(() => {
    const el = collapsibleRef.current;
    if (!el) return;

    if (showDatePicker) {
      gsap.to(el, {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [showDatePicker]);

  // Animate when showStartDatePicker changes
  useEffect(() => {
    const el = startCollapsibleRef.current;
    if (!el) return;

    if (showStartDatePicker) {
      gsap.to(el, {
        height: 'auto',
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
      });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [showStartDatePicker]);

  // Set calendar task hours from user availability
  useEffect(() => {
    if (userAvailability.length > 0) {
      const formattedHours = userAvailability.map((dayData) => ({
        date: dayData.date,
        hours: dayData.allocated_hours,
      }));
      setCalendarTaskHours(formattedHours);
    }
  }, [userAvailability]);

  // Fetch tasks for start date
  useEffect(() => {
    const getStartDateTasks = async () => {
      if (!startDate) return;

      const formattedStartDate = `${startDate.year}-${String(startDate.month + 1).padStart(
        2,
        '0'
      )}-${String(startDate.date).padStart(2, '0')}`;

      try {
        const response = await dispatch(
          fetchTargetDateTasks({
            token,
            id: responsiblePerson,
            date: formattedStartDate,
          })
        ).unwrap();
        setStartDateTasks([...response.tasks, ...response.issues]);
      } catch (error) {
        console.log(error);
      }
    };

    if (responsiblePerson && startDate) {
      getStartDateTasks();
    }
  }, [responsiblePerson, startDate]);

  // Fetch tasks for end date
  useEffect(() => {
    const getTargetDateTasks = async () => {
      if (!endDate) return;

      const formattedEndDate = `${endDate.year}-${String(endDate.month + 1).padStart(
        2,
        '0'
      )}-${String(endDate.date).padStart(2, '0')}`;

      try {
        const response = await dispatch(
          fetchTargetDateTasks({
            token,
            id: responsiblePerson,
            date: formattedEndDate,
          })
        ).unwrap();
        setTargetDateTasks([...response.tasks, ...response.issues]);
      } catch (error) {
        console.log(error);
      }
    };

    if (responsiblePerson && endDate) {
      getTargetDateTasks();
    }
  }, [responsiblePerson, endDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const issueType = await dispatch(fetchIssueType({ token })).unwrap();
        setIssueTypeOptions(
          issueType.map((i) => ({
            value: i.id,
            label: i.name,
          }))
        );
      } catch (error) {
        toast.error('Failed to load issue types.');
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (!loadingMilestone && milestoneOptions?.length > 0 && !milestoneFetchError) {
      if (newIssuesMilestoneId) dispatch(fetchKanbanTasks({ id: newIssuesMilestoneId, token }));
      setNewIssuesTaskId('');
      setTaskOptions([]);
      // Clear subtask options and selection when milestone changes
      setNewIssuesSubtaskId('');
      setSubtaskOptions([]);
    }
  }, [dispatch, loadingMilestone, milestoneFetchError, newIssuesMilestoneId, milestoneOptions]);

  useEffect(() => {
    dispatch(fetchKanbanTasks({ id: '', token }));
  }, [dispatch]);

  useEffect(() => {
    if (!loadingTasks && !tasksFetchError && tasks?.length > 0) {
      setTaskOptions(
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
        setSubtaskOptions(
          selectedTask.sub_tasks_managements.map((subtask) => ({
            value: subtask.id,
            label: subtask.title,
          }))
        );
      } else {
        setSubtaskOptions([]);
      }
      // Reset subtask selection when task changes
      setNewIssuesSubtaskId('');
    } else {
      setSubtaskOptions([]);
      setNewIssuesSubtaskId('');
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
      setTaskOptions([]);
      // Clear subtask options and selection when project changes
      setNewIssuesSubtaskId('');
      setSubtaskOptions([]);
    }
  }, [dispatch, newIssuesProjectId, projectOptions, loadingProjects, projectsFetchError]);

  useEffect(() => {
    if (!loadingProjects && (!Array.isArray(projectOptions) || projectOptions?.length === 0)) {
      dispatch(fetchKanbanProjects({ token })).unwrap();
      setProjectOptions(
        projects
          ? projects.project_managements.map((project) => ({
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

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      toast.dismiss();
      if (isSubmittingRef.current) return;

      if (!title.trim()) {
        toast.error('Title is required');
        return;
      }
      if (!responsiblePerson) {
        toast.error('Responsible Person is required');
        return;
      }
      if (!type) {
        toast.error('Issue Type is required');
        return;
      }
      if (!priority) {
        toast.error('Priority is required');
        return;
      }
      if (!endDate) {
        toast.error('End Date is required');
        return;
      }
      if (!comments.trim()) {
        toast.error('Comment is required');
        return;
      }

      setIsSubmitting(true);
      isSubmittingRef.current = true;
      const formData = new FormData();

      const formattedStartDate = startDate
        ? `${startDate.year}-${String(startDate.month + 1).padStart(2, '0')}-${String(
          startDate.date
        ).padStart(2, '0')}`
        : '';

      const formattedEndDate = `${endDate.year}-${String(endDate.month + 1).padStart(
        2,
        '0'
      )}-${String(endDate.date).padStart(2, '0')}`;

      formData.append('issue[title]', title.trim());
      formData.append('issue[status]', 'open');
      formData.append('issue[responsible_person_id]', responsiblePerson);
      formData.append('issue[project_management_id]', newIssuesProjectId || '');
      formData.append('issue[milestone_id]', newIssuesMilestoneId || '');
      formData.append('issue[task_management_id]', newIssuesSubtaskId || newIssuesTaskId || '');
      formData.append('issue[description]', description || '');
      formData.append('issue[start_date]', formattedStartDate || '');
      formData.append('issue[end_date]', formattedEndDate || '');
      formData.append(
        'issue[priority]',
        globalPriorityOptions.find((option) => option.value === priority)?.label || null
      );
      formData.append('issue[created_by_id]', JSON.parse(localStorage.getItem('user'))?.id || '');
      formData.append('issue[issue_type]', type || null);
      formData.append('issue[comment]', comments || '');
      formData.append('issue[estimated_hour]', totalWorkingHours || 0);
      // formData.append("issue[issue_allocation_times_attributes]", dateWiseHours);
      dateWiseHours.map((date) => {
        formData.append('issue[issue_allocation_times_attributes][][hours]', date.hours);
        formData.append('issue[issue_allocation_times_attributes][][minutes]', date.minutes);
        formData.append('issue[issue_allocation_times_attributes][][date]', date.date);
      });
      attachments.forEach((file) => {
        formData.append('issue[attachments][]', file);
      });

      try {
        await dispatch(createIssue({ token, payload: formData })).unwrap();
        dispatch(fetchIssue({ token }));
        closeModal();
        toast.success('Issue created successfully!');
      } catch (error) {
        console.error('Error submitting Issue:', error);
        Object.keys(error.response.data).forEach((key) => {
          toast.error(`${key} ${error.response.data[key]}`);
        })
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      dispatch,
      title,
      responsiblePerson,
      endDate,
      startDate,
      priority,
      comments,
      type,
      newIssuesProjectId,
      newIssuesMilestoneId,
      newIssuesTaskId,
      newIssuesSubtaskId,
      attachments,
      closeModal,
      totalWorkingHours,
    ]
  );

  return (
    <form className="pt-2 pb-12 h-full overflow-y-auto" onSubmit={handleSubmit}>
      <div
        id="addTask"
        className="max-w-[90%] mx-auto h-[calc(100%-4rem)] overflow-y-auto pr-3 text-[12px]"
      >
        <div className="space-y-2">
          <label className="block">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Issue Title"
            className="w-full border h-[40px] outline-none border-gray-300 p-2 text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="w-1/2 flex flex-col justify-between">
            <label className="block mb-2">Project</label>
            <SelectBox
              options={projectOptions}
              value={newIssuesProjectId}
              onChange={(selectedValue) => setNewIssuesProjectId(selectedValue)}
              placeholder={'Select Project'}
            />
          </div>
          <div className="w-1/2 flex flex-col justify-between">
            <label className="block mb-2">Milestone</label>
            <SelectBox
              options={milestoneOptions}
              value={newIssuesMilestoneId}
              onChange={(selectedValue) => setNewIssuesMilestoneId(selectedValue)}
              placeholder={'Select Milestone'}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="w-1/2 flex flex-col justify-between">
            <label className="block mb-2">
              Task
            </label>
            <SelectBox
              options={taskOptions}
              value={newIssuesTaskId}
              onChange={(selectedValue) => setNewIssuesTaskId(selectedValue)}
              placeholder={'Select Task'}
            />
          </div>
          <div className="w-1/2 flex flex-col justify-between">
            <label className="block mb-2">Subtask</label>
            <SelectBox
              options={subtaskOptions} // Use subtaskOptions
              value={newIssuesSubtaskId}
              onChange={(selectedValue) => setNewIssuesSubtaskId(selectedValue)}
              placeholder={'Select Subtask'}
            />
          </div>
        </div>
        <div className="mt-4 space-y-2 h-[100px]">
          <label className="block">Description</label>
          <textarea
            name="description"
            rows={5}
            placeholder="Enter Description"
            className="w-full border outline-none border-gray-300 p-2 text-[13px] h-[80px] overflow-y-auto resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
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
            value={responsiblePerson}
            onChange={(selectedValue) => {
              setResponsiblePerson(selectedValue);
              if (selectedValue) {
                dispatch(fetchUserAvailability({ token, id: selectedValue }));
                dispatch(fetchUserShift({ token, id: selectedValue }));
              }
            }}
          />
        </div>
        <div className="flex items-start gap-2 mt-4 text-[12px]">
          <div className="w-1/2 space-y-2">
            <label className="block">
              End Date <span className="text-red-600">*</span>
            </label>
            <button
              type="button"
              className="w-full border outline-none border-gray-300 px-2 py-[7px] text-[13px] flex items-center gap-3 text-gray-400"
              onClick={() => {
                if (showStartDatePicker) {
                  setShowStartDatePicker(false);
                }
                setShowDatePicker(!showDatePicker);
              }}
              ref={endDateRef}
            >
              {endDate ? (
                <div className="text-black flex items-center justify-between w-full">
                  <CalendarIcon className="w-4 h-4" />
                  <div>
                    End Date : {endDate.date.toString().padStart(2, '0')}{' '}
                    {monthNames[endDate.month]}
                  </div>
                  <X className="w-4 h-4 cursor-pointer" onClick={() => setEndDate(null)} />
                </div>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" /> Select End Date
                </>
              )}
            </button>
          </div>

          <div className="w-1/2 space-y-2">
            <label className="block">Start Date</label>
            <button
              type="button"
              className="w-full border outline-none border-gray-300 px-2 py-[7px] text-[13px] flex items-center gap-3 text-gray-400"
              onClick={() => {
                if (showDatePicker) {
                  setShowDatePicker(false);
                }
                setShowStartDatePicker(!showStartDatePicker);
              }}
              ref={startDateRef}
            >
              {startDate ? (
                <div className="text-black flex items-center justify-between w-full">
                  <CalendarIcon className="w-4 h-4" />
                  <div>
                    Start Date : {startDate?.date?.toString().padStart(2, '0')}{' '}
                    {monthNames[startDate.month]}
                  </div>
                  <X className="w-4 h-4 cursor-pointer" onClick={() => setStartDate(null)} />
                </div>
              ) : (
                <>
                  <CalendarIcon className="w-4 h-4" /> Select Start Date
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-between mt-3 gap-2 text-[12px]">
          <div className="space-y-2 w-full">
            <label className="block">Efforts Duration</label>
            <DurationPicker
              value={issueDuration}
              onChange={setIssueDuration}
              onDateWiseHoursChange={setDateWiseHours}
              startDate={startDate}
              endDate={endDate}
              resposiblePerson={
                responsiblePerson ? users.find((u) => u.id === responsiblePerson)?.firstname : ''
              }
              totalWorkingHours={totalWorkingHours}
              setTotalWorkingHours={setTotalWorkingHours}
              shift={shift}
            />
          </div>
        </div>

        <div
          ref={startCollapsibleRef}
          className="overflow-hidden opacity-0 h-0"
          style={{ willChange: 'height, opacity' }}
        >
          {!startDate ? (
            showStartCalender ? (
              <CustomCalender
                setShowCalender={setShowStartCalender}
                onDateSelect={setStartDate}
                selectedDate={startDate}
                taskHoursData={calendarTaskHours}
                ref={startDateRef}
              />
            ) : (
              <TaskDatePicker
                selectedDate={startDate}
                onDateSelect={setStartDate}
                startDate={null}
                userAvailability={userAvailability}
                setShowCalender={setShowStartCalender}
              />
            )
          ) : (
            <TasksOfDate
              selectedDate={startDate}
              onClose={() => { }}
              tasks={startDateTasks}
              selectedUser={responsiblePerson}
              userAvailability={userAvailability}
            />
          )}
        </div>

        <div
          ref={collapsibleRef}
          className="overflow-hidden opacity-0 h-0"
          style={{ willChange: 'height, opacity' }}
        >
          {!endDate ? (
            showCalender ? (
              <CustomCalender
                setShowCalender={setShowCalender}
                onDateSelect={setEndDate}
                selectedDate={endDate}
                taskHoursData={calendarTaskHours}
                ref={endDateRef}
              />
            ) : (
              <TaskDatePicker
                selectedDate={endDate}
                onDateSelect={setEndDate}
                startDate={startDate}
                userAvailability={userAvailability}
                setShowCalender={setShowCalender}
              />
            )
          ) : (
            <TasksOfDate
              selectedDate={endDate}
              onClose={() => { }}
              tasks={targetDateTasks}
              selectedUser={responsiblePerson}
              userAvailability={userAvailability}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <div className="w-1/2 flex flex-col justify-between">
            <label className="block mb-2">
              Type <span className="text-red-600">*</span>
            </label>
            <SelectBox
              options={issueTypeOptions}
              value={type}
              onChange={(selectedValue) => setType(selectedValue)}
              placeholder={'Select Type'}
            />
          </div>
          <div className="w-1/2 flex flex-col justify-between">
            <label className="block mb-2">
              Priority <span className="text-red-600">*</span>
            </label>
            <SelectBox
              options={globalPriorityOptions}
              value={priority}
              onChange={(selectedValue) => setPriority(selectedValue)}
            />
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <label className="block">
            Comment <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter Comment"
            className="w-full border h-[40px] outline-none border-gray-300 p-2 text-sm"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
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
            disabled={isSubmitting || loadingUsers}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default Issues;
