import MultiSelectBox from "@/components/MultiSelectBox";
import SelectBox from "@/components/SelectBox";
import { removeTagFromProject } from "@/redux/slices/projectSlice";
import { fetchTags } from "@/redux/slices/tagsSlice";
import { createSubTask, editTask, fetchKanbanTasks, fetchTargetDateTasks, taskDetails } from "@/redux/slices/taskSlice";
import { fetchUserAvailability, fetchUsers, fetchUserShift } from "@/redux/slices/userSlice";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CalendarIcon, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { CustomCalender } from "./CustomCalender";
import { TaskDatePicker } from "./TaskDatePicker";
import TasksOfDate from "./TasksOfDate";
import { DurationPicker } from "./DurationPicker";

const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

const AddSubtaskModal = ({ isModalOpen, setIsModalOpen, title }) => {
    const { mid, tid } = useParams();
    const dispatch = useDispatch();
    const token = localStorage.getItem("token");

    const addTaskModalRef = useRef(null);
    const collapsibleRef = useRef(null);
    const startCollapsibleRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const { fetchTags: tags = [] } = useSelector((state) => state.fetchTags);
    const { fetchUserAvailability: userAvailability } = useSelector((state) => state.fetchUserAvailability);
    const { fetchUserShift: shift } = useSelector((state) => state.fetchUserShift);
    const { fetchProjectTeamMembers: projectTeamMembers } = useSelector(state => state.fetchProjectTeamMembers)

    const [totalWorkingHours, setTotalWorkingHours] = useState("")
    const [dateWiseHours, setDateWiseHours] = useState("")
    const [taskDuration, setTaskDuration] = useState("")
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [startDateTasks, setStartDateTasks] = useState([]);
    const [targetDateTasks, setTargetDateTasks] = useState([]);
    const [showCalender, setShowCalender] = useState(false);
    const [showStartCalender, setShowStartCalender] = useState(false);
    const [calendarTaskHours, setCalendarTaskHours] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [prevTags, setPrevTags] = useState([]);
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [members, setMembers] = useState([])
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        responsiblePerson: "",
        responsiblePersonName: "",
        duration: "",
        priority: "",
        tags: [],
    })
    console.log(projectTeamMembers)

    useEffect(() => {
        if (projectTeamMembers) {
            const members = []

            projectTeamMembers?.project_team_members.map((member) => {
                members.push(member.user)
            })
            members.push(projectTeamMembers.team_lead)

            setMembers(members)
        }
    }, [projectTeamMembers])

    console.log(members)

    useEffect(() => {
        const getUsers = async () => {
            try {
                await dispatch(fetchUsers({ token })).unwrap();
                await dispatch(fetchTags({ token })).unwrap();
            } catch (error) {
                console.log(error)
            }
        }

        getUsers()
    }, [])

    useEffect(() => {
        const el = collapsibleRef.current;
        if (!el) return;

        if (showDatePicker) {
            gsap.to(el, {
                height: "auto",
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
            });
        } else {
            gsap.to(el, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
            });
        }
    }, [showDatePicker]);

    useEffect(() => {
        const el = startCollapsibleRef.current;
        if (!el) return;

        if (showStartDatePicker) {
            gsap.to(el, {
                height: "auto",
                opacity: 1,
                duration: 0.4,
                ease: "power2.out",
            });
        } else {
            gsap.to(el, {
                height: 0,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
            });
        }
    }, [showStartDatePicker]);

    useEffect(() => {
        const getStartDateTasks = async () => {
            if (!startDate) return;

            const formattedStartDate = `${startDate.year}-${String(
                startDate.month + 1
            ).padStart(2, "0")}-${String(startDate.date).padStart(2, "0")}`;

            try {
                const response = await dispatch(
                    fetchTargetDateTasks({
                        token,
                        id: formData.responsiblePerson,
                        date: formattedStartDate,
                    })
                ).unwrap();
                setStartDateTasks(response);
            } catch (error) {
                console.log(error);
            }
        };

        if (formData.responsiblePerson && startDate) {
            getStartDateTasks();
        }
    }, [formData.responsiblePerson, startDate]);

    useEffect(() => {
        const getTargetDateTasks = async () => {
            const formattedEndDate = `${endDate.year}-${String(
                endDate.month + 1
            ).padStart(2, "0")}-${String(endDate.date).padStart(2, "0")}`;
            try {
                const response = await dispatch(
                    fetchTargetDateTasks({
                        token,
                        id: formData.responsiblePerson,
                        date: formattedEndDate,
                    })
                ).unwrap();
                setTargetDateTasks(response);
            } catch (error) {
                console.log(error);
            }
        };
        if (formData.responsiblePerson && endDate) {
            getTargetDateTasks();
        }
    }, [formData.responsiblePerson, endDate]);

    useEffect(() => {
        if (userAvailability.length > 0) {
            const formattedHours = userAvailability.map((dayData) => ({
                date: dayData.date,
                hours: dayData.allocated_hours,
            }));
            setCalendarTaskHours(formattedHours);
        }
    }, [userAvailability]);

    useGSAP(() => {
        if (isModalOpen) {
            gsap.fromTo(
                addTaskModalRef.current,
                { x: "100%" },
                { x: "0%", duration: 0.5, ease: "power3.out" }
            );
        }
    }, [isModalOpen]);

    const closeModal = () => {
        gsap.to(addTaskModalRef.current, {
            x: "100%",
            duration: 0.5,
            ease: "power3.in",
            onComplete: () => setIsModalOpen(false),
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSelectChange = (name, value) => {
        if (name === "responsiblePerson") {
            setFormData({ ...formData, responsiblePersonName: value.label, responsiblePerson: value.value });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleMultiSelectChange = (name, selectedOptions) => {
        if (name === "tags") {
            const removed = prevTags.find(
                (prev) => !selectedOptions.some((curr) => curr.value === prev.value)
            );

            if (removed) {
                dispatch(removeTagFromProject({ token, id: removed.id }));
            }

            setPrevTags(selectedOptions);
        }

        setFormData((prev) => ({ ...prev, [name]: selectedOptions }));
    };

    const validateForm = () => {
        if (
            !formData.title ||
            !formData.responsiblePerson ||
            !startDate ||
            !endDate ||
            !formData.priority
        ) {
            toast.error("Fill all required fields");
            return false;
        }
        return true;
    }

    const handleSubmit = async (e, id) => {
        e.preventDefault();
        console.log(formData)

        if (!validateForm()) return

        setIsSubmitting(true)
        const formatedStartDate = `${startDate.year}-${startDate.month + 1}-${startDate.date
            }`;
        const formatedEndDate = `${endDate.year}-${endDate.month + 1}-${endDate.date
            }`;
        const payload = {
            parent_id: tid,
            title: formData.title,
            description: formData.description,
            responsible_person_id: formData.responsiblePerson,
            expected_start_date: formatedStartDate,
            target_date: formatedEndDate,
            estimated_hour: totalWorkingHours,
            priority: formData.priority,
            task_tag_ids: formData.tags.map((tag) => tag.value),
            task_allocation_times_attributes: dateWiseHours
        };
        if (payload.task_tag_ids.length === 0) {
            payload.task_tag_ids = null
        }
        try {
            await dispatch(createSubTask({ token, payload })).unwrap();
            await dispatch(fetchKanbanTasks({ token, id: mid })).unwrap();
            toast.success("Subtask created successfully");
            closeModal();
        } catch (error) {
            console.log(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
            <div
                ref={addTaskModalRef}
                className="bg-white py-6 rounded-lg shadow-lg w-[50%] relative h-full right-0"
            >
                <h3 className="text-lg font-medium text-center">{title}</h3>
                <X
                    className="absolute top-[26px] right-8 cursor-pointer"
                    onClick={closeModal}
                />

                <hr className="border border-[#E95420] mt-4" />

                <form
                    className="pb-12 h-full overflow-y-auto text-[12px]"
                    onSubmit={(e) => handleSubmit(e, tid)}
                >
                    <div
                        id="addTask"
                        className="max-w-[95%] mx-auto h-[calc(100%-4rem)] overflow-y-auto pr-3"
                    >
                        <div className="p-4 bg-white relative">
                            <div className="flex items-start gap-4 mt-3">
                                <div className="w-full flex flex-col justify-between">
                                    <label className="block mb-2">
                                        Subtask Title <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        placeholder="Enter Task Title"
                                        className="w-full border h-[40px] outline-none border-gray-300 p-2 text-[13px]"
                                        value={formData.title}
                                        onChange={handleInputChange}
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
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="mt-4 space-y-2 w-full">
                                <label className="block">
                                    Responsible Person <span className="text-red-600">*</span>
                                </label>
                                <SelectBox
                                    options={members.map((user) => ({
                                        label: user.name,
                                        value: user.id,
                                    }))}
                                    placeholder="Select Person"
                                    value={formData.responsiblePerson}
                                    onChange={(p) => {
                                        handleSelectChange("responsiblePerson", p)
                                        dispatch(fetchUserAvailability({ token, id: p.value }));
                                        dispatch(fetchUserShift({ token, id: p.value }));
                                    }}
                                    mom={true}
                                />
                            </div>

                            <div className="flex justify-between mt-4 gap-2 text-[12px]">
                                <div className="space-y-2 w-full">
                                    <label className="block">
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
                            </div>

                            <div className="flex justify-between mt-3 gap-2 text-[12px]">
                                <div className="space-y-2 w-full">
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
                                                    Start Date : {startDate.date.toString().padStart(2, "0")}{" "}
                                                    {monthNames[startDate.month]}
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

                                <div className="space-y-2 w-full">
                                    <label className="block">
                                        Target Date <span className="text-red-600">*</span>
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
                                                    Target : {endDate.date.toString().padStart(2, "0")}{" "}
                                                    {monthNames[endDate.month]}
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
                            </div>

                            <div
                                ref={startCollapsibleRef}
                                className="overflow-hidden opacity-0 h-0"
                                style={{ willChange: "height, opacity" }}
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
                                        userAvailability={userAvailability}
                                    />
                                )}
                            </div>

                            <div
                                ref={collapsibleRef}
                                className="overflow-hidden opacity-0 h-0"
                                style={{ willChange: "height, opacity" }}
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
                                        userAvailability={userAvailability}
                                    />
                                )}
                            </div>

                            <div className="flex gap-2 text-[12px] mt-3">
                                <div className="space-y-2 w-full">
                                    <label className="block">
                                        Priority <span className="text-red-600">*</span>
                                    </label>
                                    <SelectBox
                                        options={[
                                            { label: "High", value: "High" },
                                            { label: "Medium", value: "Medium" },
                                            { label: "Low", value: "Low" },
                                        ]}
                                        placeholder="Select Priority"
                                        name="priority"
                                        value={formData.priority}
                                        onChange={(value) => handleSelectChange("priority", value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-4 mt-3">
                                <div className="flex flex-col justify-between w-full">
                                    <label className="block mb-2">
                                        Tags <span className="text-red-600">*</span>
                                    </label>
                                    <MultiSelectBox
                                        options={tags.map((tag) => ({ value: tag.id, label: tag.name }))}
                                        value={formData.tags}
                                        onChange={(values) => handleMultiSelectChange("tags", values)}
                                        placeholder="Select Tags"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="submit"
                                className="flex items-center justify-center border-2 text-[red] border-[red] mt-4 px-4 py-2 w-[100px]"
                                disabled={isSubmitting}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddSubtaskModal