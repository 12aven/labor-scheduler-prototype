import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  Checkbox,
  FormControlLabel,
  Chip,
  Divider
} from '@mui/material';

const mockAssignments = [
  {
    id: 1,
    company: 'IntelliEvent',
    jobNumber: 'J1001',
    set: 'Main Stage',
    resourceType: 'Audio',
    task: 'Monitor Tech',
    skill: 'Stage',
    dateRange: ['2024-07-01', '2024-07-02', '2024-07-03'],
    times: {
      '2024-07-01': ['09:00', '17:00'],
      '2024-07-02': ['09:00', '17:00'],
      '2024-07-03': ['09:00', '17:00'],
    },
    venue: 'Moscone Center',
    address: '747 Howard St, San Francisco, CA 94103',
    status: 'Open',
    details: 'Monitor Tech for Main Stage, 3 days',
    assigned: false,
    specialNotes: 'Black shirt, no logos. Arrive 30 min early.',
  },
  {
    id: 2,
    company: 'IntelliEvent',
    jobNumber: 'J1002',
    set: 'Ballroom',
    resourceType: 'Audio',
    task: 'A2',
    skill: 'Patch',
    dateRange: ['2024-07-01'],
    times: {
      '2024-07-01': ['12:00', '20:00'],
    },
    venue: 'Grand Hyatt',
    address: '345 Stockton St, San Francisco, CA 94108',
    status: 'Accepted',
    details: 'A2 for Ballroom, 1 day',
    assigned: false,
    specialNotes: '',
  },
  {
    id: 3,
    company: 'IntelliEvent',
    jobNumber: 'J1003',
    set: 'Breakout Room B',
    resourceType: 'Lighting',
    task: 'LD',
    skill: 'Lighting Design',
    dateRange: ['2024-07-04', '2024-07-05'],
    times: {
      '2024-07-04': ['10:00', '18:00'],
      '2024-07-05': ['10:00', '18:00'],
    },
    venue: 'Hilton Union Square',
    address: '333 O Farrell St, San Francisco, CA 94102',
    status: 'Accepted',
    details: 'LD for Breakout Room B, 2 days',
    assigned: true,
    specialNotes: 'Formal attire required.',
  },
];

function FreelancerPortal() {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [selected, setSelected] = useState(null);
  const [acceptDays, setAcceptDays] = useState([]);

  const handleStatus = (id, status, daysAccepted = null) => {
    setAssignments(prev => prev.map(a =>
      a.id === id
        ? { ...a, status, acceptedDays: daysAccepted || (status === 'Accepted' ? a.dateRange : []) }
        : a
    ));
    setSelected(null);
    setAcceptDays([]);
  };

  const handleDayToggle = (day) => {
    setAcceptDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Job Assignments</Typography>
      <Grid container spacing={2}>
        {assignments.map(a => (
          <Grid item xs={12} key={a.id}>
            <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                    <b>{a.company}</b> — {a.jobNumber} — {a.task} ({a.set}, {a.resourceType})
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Chip label={`${a.dateRange[0]} to ${a.dateRange[a.dateRange.length - 1]}`} color="primary" variant="outlined" />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body1">
                    Status:{' '}
                    <b>
                      {a.status === 'Accepted' && a.assigned
                        ? 'Assigned'
                        : a.status === 'Accepted' && !a.assigned
                        ? 'Not Assigned'
                        : a.status}
                    </b>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                  <Button variant="contained" onClick={() => setSelected(a)} size="small">View Details</Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>Assignment Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={4} alignItems="flex-start">
              {/* Left: Assignment/job details */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1"><b>Company:</b> {selected.company}</Typography>
                <Typography variant="subtitle1"><b>Job:</b> {selected.jobNumber}</Typography>
                <Typography variant="subtitle1"><b>Venue:</b> {selected.venue}</Typography>
                <Typography variant="subtitle1"><b>Address:</b> {selected.address}</Typography>
                <Typography variant="subtitle1"><b>Set/Room:</b> {selected.set}</Typography>
                <Typography variant="subtitle1"><b>Resource Type:</b> {selected.resourceType}</Typography>
                <Typography variant="subtitle1"><b>Task:</b> {selected.task}</Typography>
                <Typography variant="subtitle1"><b>Skill:</b> {selected.skill}</Typography>
                <Typography variant="subtitle1"><b>Dates:</b> {selected.dateRange.join(', ')}</Typography>
                <Typography variant="subtitle1"><b>Details:</b> {selected.details}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>
                  Status:{' '}
                  <span style={{ color: '#1976d2' }}>
                    {selected.status === 'Accepted' && selected.assigned
                      ? 'Assigned'
                      : selected.status === 'Accepted' && !selected.assigned
                      ? 'Not Assigned'
                      : selected.status}
                  </span>
                </Typography>
                {selected.specialNotes && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: '#f9f9f9' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Special Notes:</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{selected.specialNotes}</Typography>
                  </Paper>
                )}
              </Grid>
              {/* Right: Days/times for accepting */}
              <Grid item xs={12} md={6}>
                {selected.status === 'Open' && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Select Days to Accept:</Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={acceptDays.length === selected.dateRange.length}
                          onChange={e => setAcceptDays(e.target.checked ? [...selected.dateRange] : [])}
                        />
                      }
                      label="All Days"
                    />
                    <Divider sx={{ my: 1 }} />
                    {selected.dateRange.map(day => (
                      <FormControlLabel
                        key={day}
                        control={
                          <Checkbox
                            checked={acceptDays.includes(day)}
                            onChange={() => handleDayToggle(day)}
                          />
                        }
                        label={
                          <span>
                            {day}{' '}
                            <Chip
                              label={selected.times && selected.times[day] ? `${selected.times[day][0]} - ${selected.times[day][1]}` : ''}
                              color="primary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </span>
                        }
                        sx={{ display: 'block', ml: 2 }}
                      />
                    ))}
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleStatus(selected.id, 'Accepted', acceptDays.length > 0 ? acceptDays : selected.dateRange)}
                        disabled={acceptDays.length === 0}
                        sx={{ mr: 1 }}
                      >
                        Accept Selected Days
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleStatus(selected.id, 'Rejected')}
                      >
                        Reject
                      </Button>
                    </Box>
                  </Box>
                )}
                {selected.status === 'Accepted' && selected.acceptedDays && (
                  <Box sx={{ mt: 0 }}>
                    <Typography variant="subtitle1" sx={{ color: '#1976d2', fontWeight: 700 }}>Accepted Days:</Typography>
                    <Box component="ul" sx={{ pl: 3, mt: 1, mb: 0 }}>
                      {selected.acceptedDays.map(day => (
                        <li key={day}>
                          <Chip
                            label={`${day} ${selected.times && selected.times[day] ? `${selected.times[day][0]} - ${selected.times[day][1]}` : ''}`}
                            color="primary"
                            size="small"
                            sx={{ mr: 1, mb: 0.5 }}
                          />
                        </li>
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" color="inherit" onClick={() => setSelected(null)}>
              Close
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default FreelancerPortal; 