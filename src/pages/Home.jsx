import React, { useState } from 'react';
import TaskList from './TaskList';
import TaskTimer from './TaskTimer';

export default function Home() {
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  if (selectedTaskId !== null) {
    return <TaskTimer taskId={selectedTaskId} onBack={() => setSelectedTaskId(null)} />;
  }

  return <TaskList onSelectTask={(id) => setSelectedTaskId(id)} />;
}
