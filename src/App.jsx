import { useState } from 'react'
import './App.css'
import GanttChart from './GanttChart'
import FreelancerPortal from './FreelancerPortal'

function App() {
  const [view, setView] = useState('coordinator')

  return (
    <div className="app-container">
      <header>
        <h1>IntelliEvent Labor Resource Scheduling Prototype</h1>
        <nav>
          <button onClick={() => setView('coordinator')}>Labor Coordinator</button>
          <button onClick={() => setView('freelancer')}>Freelancer Portal</button>
        </nav>
      </header>
      <main>
        {view === 'coordinator' ? (
          <section>
            <h2>Labor Coordinator - Gantt Chart View</h2>
            <GanttChart />
          </section>
        ) : (
          <section>
            <h2>Freelancer Portal</h2>
            <FreelancerPortal />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
