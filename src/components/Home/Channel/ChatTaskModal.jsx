import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserAvailability, fetchUsers, fetchUserShift } from '../../../redux/slices/userSlice';
import { fetchTags } from '../../../redux/slices/tagsSlice';
import MultiSelectBox from '../../MultiSelectBox';
import SelectBox from '../../SelectBox';
import { createTask, fetchTargetDateTasks } from '../../../redux/slices/taskSlice';
import toast from 'react-hot-toast';
import { DurationPicker } from '@/components/DurationPicker';
import { CalendarIcon, X } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TaskDatePicker } from '@/components/TaskDatePicker';
import TasksOfDate from '@/components/TasksOfDate';
import { CustomCalender } from '@/components/CustomCalender';
import TaskTitleAutocomplete from '../../TaskTitleAutocomplete';
import { useLocation, useParams } from 'react-router-dom';
import { fetchProjects } from '@/redux/slices/projectSlice';
import { fetchMilestone } from '@/redux/slices/milestoneSlice';

const ChatTaskModal = ({ message, isOpen, onClose }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const path = useLocation().pathname;
  const token = localStorage.getItem('token');

  const { loading } = useSelector((state) => state.createTask);
  const { fetchUsers: users = [] } = useSelector((state) => state.fetchUsers);
  const { fetchTags: tags = [] } = useSelector((state) => state.fetchTags);
  const { fetchUserAvailability: userAvailability } = useSelector(
    (state) => state.fetchUserAvailability
  );
  const { fetchUserShift: shift } = useSelector((state) => state.fetchUserShift);
  console.log(users);

  const [taskDuration, setTaskDuration] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalWorkingHours, setTotalWorkingHours] = useState(0);
  const [dateWiseHours, setDateWiseHours] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [startDateTasks, setStartDateTasks] = useState([]);
  const [targetDateTasks, setTargetDateTasks] = useState([]);
  const [showCalender, setShowCalender] = useState(false);
  const [showStartCalender, setShowStartCalender] = useState(false);
  const [calendarTaskHours, setCalendarTaskHours] = useState([]);
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [formData, setFormData] = useState({
    project: '',
    milestone: '',
    taskTitle: '',
    description: '',
    responsiblePerson: '',
    responsiblePersonName: '',
    priority: '',
    observer: [],
    tags: [],
  });

  const [prevTags, setPrevTags] = useState([]);
  const [prevObservers, setPrevObservers] = useState([]);

  const collapsibleRef = useRef(null);
  const startCollapsibleRef = useRef(null);
  const endDateRef = useRef(null);
  const startDateRef = useRef(null);

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

  // Initialize data on mount
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchUsers({ token }));
      dispatch(fetchTags({ token }));

      // Set task title from message
      if (message?.body) {
        setFormData((prev) => ({
          ...prev,
          taskTitle: message.body,
          description: message.body,
        }));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const getProjects = async () => {
      try {
        const response = await dispatch(fetchProjects({ token })).unwrap();
        setProjects(response);
      } catch (error) {
        console.log(error);
      }
    };

    getProjects();
  }, []);

  useEffect(() => {
    const getMilestones = async () => {
      if (!selectedProject) return;

      try {
        const response = await dispatch(fetchMilestone({ token, id: selectedProject })).unwrap();
        setMilestones(response);
      } catch (error) {
        console.log(error);
      }
    };

    getMilestones();
  }, [selectedProject]);

  // Animate date picker
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

  // Animate start date picker
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
            id: formData.responsiblePerson,
            date: formattedStartDate,
          })
        ).unwrap();
        setStartDateTasks([...response.tasks, ...response.issues]);
      } catch (error) {
        console.log(error);
      }
    };

    if (formData.responsiblePerson && startDate) {
      getStartDateTasks();
    }
  }, [formData.responsiblePerson, startDate]);

  // Fetch tasks for end date
  useEffect(() => {
    const getTargetDateTasks = async () => {
      const formattedEndDate = `${endDate.year}-${String(endDate.month + 1).padStart(
        2,
        '0'
      )}-${String(endDate.date).padStart(2, '0')}`;
      try {
        const response = await dispatch(
          fetchTargetDateTasks({
            token,
            id: formData.responsiblePerson,
            date: formattedEndDate,
          })
        ).unwrap();
        setTargetDateTasks([...response.tasks, ...response.issues]);
      } catch (error) {
        console.log(error);
      }
    };
    if (formData.responsiblePerson && endDate) {
      getTargetDateTasks();
    }
  }, [formData.responsiblePerson, endDate]);

  // Update duration in formData
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      duration: Math.round(totalWorkingHours),
    }));
  }, [totalWorkingHours]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    if (name === 'tags') {
      setPrevTags(selectedOptions);
    }

    if (name === 'observer') {
      setPrevObservers(selectedOptions);
    }

    setFormData((prev) => ({ ...prev, [name]: selectedOptions }));
  };

  const createTaskPayload = (data) => {
    const formatedEndDate = `${endDate.year}-${endDate.month + 1}-${endDate.date}`;
    const formatedStartDate = `${startDate.year}-${startDate.month + 1}-${startDate.date}`;

    return {
      title: data.taskTitle,
      description: data.description,
      responsible_person_id: data.responsiblePerson,
      priority: data.priority,
      observer_ids: data.observer.map((observer) => observer.value),
      task_tag_ids: data.tags.map((tag) => tag.value),
      expected_start_date: formatedStartDate,
      target_date: formatedEndDate,
      allocation_date: formatedEndDate,
      project_management_id: data.project,
      milestone_id: data.milestone,
      active: true,
      estimated_hour: totalWorkingHours,
      task_allocation_times_attributes: dateWiseHours,
      ...(id && path.includes('messages') && { conversation_id: id }),
      ...(id && path.includes('groups') && { project_space_id: id }),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.taskTitle ||
      !formData.responsiblePerson ||
      !formData.priority ||
      !formData.observer.length ||
      !formData.tags.length ||
      !endDate
    ) {
      toast.dismiss();
      toast.error('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);

    const payload = createTaskPayload(formData);

    try {
      await dispatch(createTask({ token, payload })).unwrap();
      toast.dismiss();
      toast.success('Task created successfully from chat message.');
      onClose();
      // Reset form
      setFormData({
        project: '',
        milestone: '',
        taskTitle: '',
        description: '',
        responsiblePerson: '',
        responsiblePersonName: '',
        priority: '',
        observer: [],
        tags: [],
      });
      setStartDate(null);
      setEndDate(null);
      setPrevTags([]);
      setPrevObservers([]);
    } catch (error) {
      console.error('Error creating task:', error);
      toast.dismiss();
      toast.error('Error creating task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalRef = useRef(null);

  useGSAP(() => {
    if (isOpen) {
      gsap.fromTo(modalRef.current, { x: '100%' }, { x: '0%', duration: 0.5, ease: 'power3.out' });
    }
  }, [isOpen]);

  const closeModal = () => {
    gsap.to(modalRef.current, {
      x: '100%',
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => onClose(),
    });
  };

  if (!isOpen) return null;

  console.log(formData);

  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-50">
      <div
        ref={modalRef}
        className="bg-white py-6 rounded-lg shadow-lg w-[50%] relative h-full right-0 flex flex-col"
      >
        <div className="px-6 pb-4 border-b border-[#E95420]">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Create Task from Chat</h3>
            <X
              className="w-6 h-6 cursor-pointer hover:bg-gray-100 p-1 rounded"
              onClick={closeModal}
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 pb-20 text-sm space-y-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="mt-4 space-y-2 w-full">
              <label className="block ms-2">Project</label>
              <SelectBox
                options={[
                  ...projects.map((project) => ({
                    label: project.title,
                    value: project.id,
                  })),
                ]}
                placeholder="Select Project"
                value={formData.project}
                onChange={(value) => {
                  setFormData({ ...formData, project: value });
                  setSelectedProject(value);
                }}
              />
            </div>
            <div className="mt-4 space-y-2 w-full">
              <label className="block ms-2">Milestone</label>
              <SelectBox
                options={milestones.map((milestone) => ({
                  label: milestone.title,
                  value: milestone.id,
                }))}
                placeholder="Select Milestone"
                value={formData.milestone}
                onChange={(value) => setFormData({ ...formData, milestone: value })}
              />
            </div>
          </div>
          {/* Task Title */}
          <div className="space-y-2">
            <label className="block font-medium">
              Task Title <span className="text-red-600">*</span>
            </label>
            <TaskTitleAutocomplete
              value={formData.taskTitle}
              onChange={handleInputChange}
              token={token}
              milestone_id={formData.milestone}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block font-medium">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Enter Description"
              className="w-full border outline-none border-gray-300 p-2 text-sm rounded resize-none"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Responsible Person and Role */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block font-medium">
                Responsible Person <span className="text-red-600">*</span>
              </label>
              <SelectBox
                options={users.map((user) => ({
                  label: user?.firstname + ' ' + user?.lastname,
                  value: user.id,
                }))}
                placeholder="Select Person"
                value={formData.responsiblePerson}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    responsiblePerson: value,
                    responsiblePersonName:
                      users.find((user) => user.id === value)?.firstname +
                      ' ' +
                      users.find((user) => user.id === value)?.lastname,
                  });
                  dispatch(fetchUserAvailability({ token, id: value }));
                  dispatch(fetchUserShift({ token, id: value }));
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Role</label>
              <input
                type="text"
                value={
                  users.find((user) => user.id === formData.responsiblePerson)?.lock_role
                    ?.display_name || ''
                }
                className="text-sm border border-gray-300 px-2 py-2 w-full bg-gray-200 rounded"
                readOnly
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block font-medium">
                Target Date <span className="text-red-600">*</span>
              </label>
              <button
                type="button"
                className="w-full border outline-none border-gray-300 px-2 py-2 text-sm flex items-center gap-3 text-gray-400"
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
                      {endDate.date.toString().padStart(2, '0')} {monthNames[endDate.month]}
                    </div>
                    <X className="w-4 h-4" onClick={() => setEndDate(null)} />
                  </div>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4" /> Select Target Date
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Start Date</label>
              <button
                type="button"
                className="w-full border outline-none border-gray-300 px-2 py-2 text-sm flex items-center gap-3 text-gray-400"
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
                      {startDate?.date?.toString().padStart(2, '0')} {monthNames[startDate.month]}
                    </div>
                    <X className="w-4 h-4" onClick={() => setStartDate(null)} />
                  </div>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4" /> Select Start Date
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="block font-medium">
              Duration <span className="text-red-600">*</span>
            </label>
            <DurationPicker
              value={taskDuration}
              onChange={setTaskDuration}
              onDateWiseHoursChange={setDateWiseHours}
              startDate={startDate}
              endDate={endDate}
              resposiblePerson={formData.responsiblePersonName}
              totalWorkingHours={totalWorkingHours}
              setTotalWorkingHours={setTotalWorkingHours}
              shift={shift}
            />
          </div>

          {/* Date Pickers */}
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
                  shift={shift}
                />
              ) : (
                <TaskDatePicker
                  selectedDate={startDate}
                  onDateSelect={setStartDate}
                  startDate={null}
                  userAvailability={userAvailability}
                  setShowCalender={setShowStartCalender}
                  shift={shift}
                />
              )
            ) : (
              <TasksOfDate
                selectedDate={startDate}
                onClose={() => {}}
                tasks={startDateTasks}
                selectedUser={formData.responsiblePerson}
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
                  shift={shift}
                />
              ) : (
                <TaskDatePicker
                  selectedDate={endDate}
                  onDateSelect={setEndDate}
                  startDate={startDate}
                  userAvailability={userAvailability}
                  setShowCalender={setShowCalender}
                  shift={shift}
                />
              )
            ) : (
              <TasksOfDate
                selectedDate={endDate}
                onClose={() => {}}
                tasks={targetDateTasks}
                selectedUser={formData.responsiblePerson}
                userAvailability={userAvailability}
              />
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="block font-medium">
              Priority <span className="text-red-600">*</span>
            </label>
            <SelectBox
              options={[
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Low', value: 'Low' },
              ]}
              placeholder="Select Priority"
              value={formData.priority}
              onChange={(value) => setFormData({ ...formData, priority: value })}
            />
          </div>

          {/* Observer */}
          <div className="space-y-2">
            <label className="block font-medium">
              Observer <span className="text-red-600">*</span>
            </label>
            <MultiSelectBox
              options={users.map((user) => ({
                label: user?.firstname + ' ' + user?.lastname,
                value: user.id,
              }))}
              value={formData.observer}
              placeholder="Select Observer"
              onChange={(values) => handleMultiSelectChange('observer', values)}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="block font-medium">
              Tags <span className="text-red-600">*</span>
            </label>
            <MultiSelectBox
              options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
              value={formData.tags}
              onChange={(values) => handleMultiSelectChange('tags', values)}
              placeholder="Select Tags"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex items-center justify-center border-2 text-gray-600 border-gray-400 px-4 py-2 w-max"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex items-center justify-center border-2 text-white bg-[#C72030] border-[#C72030] px-4 py-2 w-max hover:bg-[#a01828]"
            >
              {loading || isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatTaskModal;
