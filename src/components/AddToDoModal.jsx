import { useGSAP } from "@gsap/react";
import { baseURL } from "../../apiDomain";
import axios from "axios";
import gsap from "gsap";
import { X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

const AddToDoModal = ({ isModalOpen, setIsModalOpen, getTodos }) => {
    const addTaskModalRef = useRef(null);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSubmit = async (e) => {
        try {
            e.preventDefault();
            if (!title || !date) {
                toast.error("Please fill in all fields");
                return;
            }

            setIsSubmitting(true);

            const payload = {
                todo: {
                    title,
                    target_date: date,
                    status: "open"
                }
            }

            await axios.post(`${baseURL}/todos.json`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
            })
            toast.success("To-Do added successfully");
            closeModal()
            getTodos()
        } catch (error) {
            console.log(error)
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
            <div
                ref={addTaskModalRef}
                className="bg-white py-6 rounded-lg shadow-lg w-[35%] relative h-full right-0"
            >
                <h3 className="text-lg font-medium text-center">Add ToDo</h3>
                <X
                    className="absolute top-[26px] right-8 cursor-pointer"
                    onClick={closeModal}
                />

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
                            <input
                                type="text"
                                placeholder="Enter Title"
                                className="w-full border h-[40px] outline-none border-gray-300 p-2 text-sm"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="block">
                                Target Date <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="date"
                                placeholder="Target Date"
                                className="w-full border h-[40px] outline-none border-gray-300 p-2 text-sm"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center justify-center gap-4 w-full bottom-0 py-3 bg-white mt-10">
                            <button
                                type="submit"
                                className="flex items-center justify-center border-2 text-[black] border-[red] px-4 py-2 w-[100px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Add Todo"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddToDoModal