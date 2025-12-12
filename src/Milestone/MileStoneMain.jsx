import { useState } from 'react';
import MilestoneHeader from './MilestoneHeader';
import MilestoneBody from './MilestoneBody';
import MilestoneKanban from '../components/MilestoneKanban';
import MilestoneList from '../components/MilestoneList';

const MileStoneMain = () => {
  const [selectedType, setSelectedType] = useState('Gantt');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColumns, setSelectedColumns] = useState(() => {
    const saved = localStorage.getItem('MilestoneTableColumns');
    return saved ? JSON.parse(saved) : {};
  });

  const handleColumnsChange = (columns) => {
    setSelectedColumns(columns);
  };

  return (
    <div>
      <MilestoneHeader
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onColumnsChange={handleColumnsChange}
        selectedColumns={selectedColumns}
      />
      {selectedType === 'Gantt' ? (
        <MilestoneBody selectedColumns={selectedColumns} />
      ) : selectedType === 'List' ? (
        <MilestoneList searchQuery={searchQuery} selectedColumns={selectedColumns} />
      ) : (
        <MilestoneKanban />
      )}
    </div>
  );
};

export default MileStoneMain;
