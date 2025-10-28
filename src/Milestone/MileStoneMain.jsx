import { useState } from 'react';
import MilestoneHeader from './MilestoneHeader';
import MilestoneBody from './MilestoneBody';
import MilestoneKanban from '../components/MilestoneKanban';
import MilestoneList from '../components/MilestoneList';

const MileStoneMain = () => {
    const [selectedType, setSelectedType] = useState(
        "Gantt");
    return (
        <div>
            <MilestoneHeader selectedType={selectedType} setSelectedType={setSelectedType} />
            {
                selectedType === "Gantt" ? (
                    <MilestoneBody />
                ) : selectedType === "List" ? (
                    <MilestoneList />
                ) : (
                    <MilestoneKanban />
                )
            }
        </div>
    );
};

export default MileStoneMain;