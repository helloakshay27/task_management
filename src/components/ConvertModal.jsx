import { useGSAP } from '@gsap/react';
import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import gsap from 'gsap';
import Tasks from './Home/Task/Modals/task';
import Details from './Home/Projects/Modals/Details';
import Milestones from './Home/Projects/Modals/Milestone';
import axios from 'axios';
import { baseURL } from '../../apiDomain';
import toast from 'react-hot-toast';

const ConvertModal = ({ isModalOpen, setIsModalOpen, prefillData, opportunityId }) => {
  const convertModalRef = useRef(null);
  const [selectedType, setSelectedType] = useState('Project'); // Default to Task
  const token = localStorage.getItem('token');

  useGSAP(() => {
    if (isModalOpen) {
      gsap.fromTo(
        convertModalRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.5, ease: 'power3.out' }
      );
    }
  }, [isModalOpen]);

  const closeModal = () => {
    gsap.to(convertModalRef.current, {
      x: '100%',
      duration: 0.5,
      ease: 'power3.in',
      onComplete: () => {
        setIsModalOpen(false);
        setSelectedType('Task'); // Reset to default
      },
    });
  };

  const updateOpportunityWithConversion = async (conversionData) => {
    try {
      const payload = {
        opportunity: {
          status: 'in_progress',
          ...conversionData,
        },
      };

      await axios.put(`${baseURL}/opportunities/${opportunityId}.json`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Opportunity converted successfully!');

      // Refresh the page after 1 second
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast.error('Failed to update opportunity status');
    }
  };

  const handleTaskSuccess = (taskId) => {
    updateOpportunityWithConversion({
      task_management_id: taskId,
    });
  };

  const handleProjectSuccess = (projectId) => {
    updateOpportunityWithConversion({
      project_management_id: projectId,
    });
  };

  const handleMilestoneSuccess = (milestoneId) => {
    updateOpportunityWithConversion({
      milestone_id: milestoneId,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-end bg-black bg-opacity-50 z-10">
      <div
        ref={convertModalRef}
        className="bg-white py-6 rounded-lg shadow-lg w-[50%] relative h-full right-0"
      >
        <h3 className="text-lg font-medium text-center">Convert Opportunity</h3>
        <X className="absolute top-[26px] right-8 cursor-pointer" onClick={closeModal} />

        <hr className="border border-[#E95420] my-4" />

        {/* Radio Buttons */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="convertType"
                value="Project"
                checked={selectedType === 'Project'}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-[14px] font-medium">Convert to Project</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="convertType"
                value="Milestone"
                checked={selectedType === 'Milestone'}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-[14px] font-medium">Convert to Milestone</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="convertType"
                value="Task"
                checked={selectedType === 'Task'}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-[14px] font-medium">Convert to Task</span>
            </label>
          </div>
        </div>

        {/* Forms based on selection */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 200px)' }}>
          {selectedType === 'Task' && (
            <Tasks
              isEdit={false}
              onCloseModal={closeModal}
              prefillData={{
                title: prefillData?.title,
                project: prefillData?.project,
                projectName: prefillData?.projectName,
                task: prefillData?.task,
                taskName: prefillData?.taskName,
                description: prefillData?.description,
                opportunityId: opportunityId,
              }}
              onSuccess={handleTaskSuccess}
            />
          )}
          {selectedType === 'Project' && (
            <Details
              setTab={() => {}}
              setOpenTagModal={() => {}}
              setOpenTeamModal={() => {}}
              isEdit={false}
              endText="Create"
              templateDetails={{
                title: prefillData?.title,
                description: prefillData?.description,
                opportunityId: opportunityId,
              }}
              opportunityId={opportunityId}
              onSuccess={handleProjectSuccess}
            />
          )}
          {selectedType === 'Milestone' && (
            <Milestones
              closeModal={closeModal}
              prefillData={{
                title: prefillData?.title,
                description: prefillData?.description,
                opportunityId: opportunityId,
              }}
              opportunityId={opportunityId}
              onSuccess={handleMilestoneSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ConvertModal;
