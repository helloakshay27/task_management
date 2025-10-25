import { useGSAP } from "@gsap/react";
import { useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import gsap from "gsap";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { fetchMilestoneById, updateMilestone } from "../redux/slices/milestoneSlice";
import { fetchUsers } from "../redux/slices/userSlice";
import SelectBox from "./SelectBox";

const EditMilestoneModal = ({ isModalOpen, setIsModalOpen, milestoneId }) => {
    const token = localStorage.getItem("token");
    const dispatch = useDispatch();
    const addTaskModalRef = useRef(null);

    const { fetchUsers: users = [] } = useSelector((state) => state.fetchUsers);
    const { fetchMilestone: milestones = [] } = useSelector((state) => state.fetchMilestone);

    const [formData, setFormData] = useState({
        title: "",
        ownerId: null,
        startDate: "",
        endDate: "",
        dependsOnId: null,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadMilestoneData = async () => {
            if (!isModalOpen || !milestoneId) return;

            try {
                setIsLoading(true);
                await dispatch(fetchUsers({ token }));
                const milestone = await dispatch(fetchMilestoneById({ token, id: milestoneId })).unwrap();

                setFormData({
                    title: milestone.title || "",
                    ownerId: milestone.owner_id || null,
                    startDate: milestone.start_date?.split("T")[0] || "",
                    endDate: milestone.end_date?.split("T")[0] || "",
                    dependsOnId: milestone.depends_on_id || null,
                });
            } catch (error) {
                toast.error("Failed to load milestone data");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        loadMilestoneData();
    }, [isModalOpen, milestoneId, dispatch, token]);

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
        setFormData({ ...formData, [name]: value });
    };

    const calculateDuration = () => {
        if (!formData.startDate || !formData.endDate) return "";

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        if (startDay.getTime() === today.getTime()) {
            if (endDay.getTime() === today.getTime()) {
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);
                const msToEnd = endOfToday - now;
                const totalMins = Math.floor(msToEnd / (1000 * 60));
                const hrs = Math.floor(totalMins / 60);
                const mins = totalMins % 60;
                return `0d : ${hrs}h : ${mins}m`;
            } else {
                if (endDay < startDay) return "Invalid: End date before start date";
                const daysDiff = Math.floor((endDay - today) / (1000 * 60 * 60 * 24));
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999);
                const msToday = endOfToday - now;
                const totalMinutes = Math.floor(msToday / (1000 * 60));
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${daysDiff}d : ${hours}h : ${minutes}m`;
            }
        } else {
            if (endDay < startDay) return "Invalid: End date before start date";
            const days = Math.floor((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1;
            return `${days}d : 0h : 0m`;
        }
    };

    const validateForm = () => {
        toast.dismiss();
        if (!formData.title) return toast.error("Milestone title is required.") && false;
        if (!formData.ownerId) return toast.error("Select milestone owner.") && false;
        if (!formData.startDate) return toast.error("Start date is required.") && false;
        if (!formData.endDate) return toast.error("End date is required.") && false;
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const payload = {
            milestone: {
                title: formData.title,
                owner_id: formData.ownerId,
                start_date: formData.startDate,
                end_date: formData.endDate,
                depends_on_id: formData.dependsOnId,
            },
        };

        try {
            await dispatch(updateMilestone({ token, id: milestoneId, payload })).unwrap();
            toast.success("Milestone updated successfully");
            closeModal();
            window.location.reload();
        } catch (error) {
            toast.error("Failed to update milestone");
            console.error(error);
        }
    };

    const availableMilestones = milestones.filter(m => m.id !== milestoneId);

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
            <div
                ref={addTaskModalRef}
                className="bg-white py-6 rounded-lg shadow-lg w-1/3 relative h-full right-0"
            >
                <h3 className="text-[14px] font-medium text-center">Edit Milestone</h3>
                <X
                    className="absolute top-[26px] right-8 cursor-pointer"
                    onClick={closeModal}
                />
                <hr className="border border-[#E95420] my-4" />

                {isLoading ? (
                    <div className="flex items-center justify-center h-[calc(100%-100px)]">
                        <p className="text-gray-500">Loading milestone data...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-8 h-[calc(100%-100px)] overflow-y-auto">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[12px]">
                                    Milestone Title <span className="text-red-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    placeholder="Enter Milestone Title"
                                    className="w-full border h-[40px] outline-none border-gray-300 p-2 text-[12px]"
                                    onChange={handleInputChange}
                                    value={formData.title}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px]">
                                    Milestone Owner <span className="text-red-600">*</span>
                                </label>
                                <SelectBox
                                    options={users.map((user) => ({
                                        label: `${user.firstname} ${user.lastname}`,
                                        value: user.id,
                                    }))}
                                    onChange={(value) => handleSelectChange("ownerId", value)}
                                    value={formData.ownerId}
                                    placeholder="Select Owner"
                                    style={{ border: "1px solid #b3b2b2" }}
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <label className="block text-[12px]">
                                        Start Date <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        type="date"
                                        className="w-full border outline-none border-gray-300 p-2 text-[12px]"
                                    />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <label className="block text-[12px]">
                                        End Date <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        min={formData.startDate}
                                        className="w-full border outline-none border-gray-300 p-2 text-[12px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px]">Duration</label>
                                <input
                                    type="text"
                                    value={calculateDuration()}
                                    className="w-full border outline-none border-gray-300 p-2 text-[12px] bg-gray-200"
                                    readOnly
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[12px]">Depends On</label>
                                <SelectBox
                                    options={availableMilestones.map((m) => ({
                                        label: m.title,
                                        value: m.id,
                                    }))}
                                    style={{ border: "1px solid #b3b2b2" }}
                                    onChange={(value) => handleSelectChange("dependsOnId", value)}
                                    value={formData.dependsOnId}
                                    placeholder="Select Dependency"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                type="submit"
                                className="border-2 text-black border-red-500 px-6 py-2 text-[12px] hover:bg-red-50"
                            >
                                Update
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="border-2 text-black border-gray-400 px-6 py-2 text-[12px] hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default EditMilestoneModal;