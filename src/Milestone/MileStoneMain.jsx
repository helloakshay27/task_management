import { useState } from 'react';
import MilestoneHeader from './MilestoneHeader';
import MilestoneBody from './MilestoneBody';
import MilestoneKanban from '../components/MilestoneKanban';
import MilestoneList from '../components/MilestoneList';

const MileStoneMain = () => {
    const [selectedType, setSelectedType] = useState(
        "Gantt");
    const [searchQuery, setSearchQuery] = useState("")
    return (
        <div>
            <MilestoneHeader selectedType={selectedType} setSelectedType={setSelectedType} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            {
                selectedType === "Gantt" ? (
                    <MilestoneBody />
                ) : selectedType === "List" ? (
                    <MilestoneList searchQuery={searchQuery} />
                ) : (
                    <MilestoneKanban />
                )
            }
        </div>
    );
};

export default MileStoneMain;