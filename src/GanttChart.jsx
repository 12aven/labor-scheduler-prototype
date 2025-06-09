import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Radio,
  Typography,
  Chip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import RemoveIcon from '@mui/icons-material/Remove';

// Mock data for jobs, sets/rooms, resource types, and assignments
const mockJobs = [
  {
    jobNumber: 'J1001',
    sets: [
      {
        name: 'Main Stage',
        resources: [
          {
            type: 'Audio',
            needs: [
              { task: 'FOH Engineer', skill: 'Mixing', assigned: 'Alice', days: [1, 2, 3], times: { 1: ['09:00', '17:00'], 2: ['09:00', '17:00'], 3: ['09:00', '17:00'] } },
              { task: 'Monitor Tech', skill: 'Stage', assigned: '', days: [1, 2, 3], times: { 1: ['09:00', '17:00'], 2: ['09:00', '17:00'], 3: ['09:00', '17:00'] } },
            ],
          },
          {
            type: 'Lighting',
            needs: [
              { task: 'LD', skill: 'Lighting Design', assigned: 'Bob', days: [2, 3], times: { 2: ['10:00', '18:00'], 3: ['10:00', '18:00'] } },
            ],
          },
        ],
      },
      {
        name: 'Breakout Room A',
        resources: [
          {
            type: 'Video',
            needs: [
              { task: 'Camera Op', skill: 'Camera', assigned: '', days: [1, 2], times: { 1: ['08:00', '16:00'], 2: ['08:00', '16:00'] } },
            ],
          },
        ],
      },
    ],
  },
  {
    jobNumber: 'J1002',
    sets: [
      {
        name: 'Ballroom',
        resources: [
          {
            type: 'Audio',
            needs: [
              { task: 'A2', skill: 'Patch', assigned: '', days: [1], times: { 1: ['12:00', '20:00'] } },
            ],
          },
        ],
      },
    ],
  },
];

const initialFreelancers = [
  { name: 'Alice', type: 'Audio' },
  { name: 'Bob', type: 'Lighting' },
  { name: 'Charlie', type: 'Video' },
  { name: 'Dana', type: 'Audio' },
];

const dateRange = [
  '2024-07-01',
  '2024-07-02',
  '2024-07-03',
  '2024-07-04',
  '2024-07-05',
  '2024-07-06',
  '2024-07-07',
];

// Email template state
const emailTemplates = [
  {
    id: 'default',
    name: 'Default Assignment Request',
    body: 'Hello,\n\nYou have been requested for a labor assignment. Please review the details and respond.\n\nThank you.'
  },
  {
    id: 'urgent',
    name: 'Urgent Fill Request',
    body: 'Hi,\n\nWe urgently need to fill a labor slot. Please let us know your availability as soon as possible.\n\nThanks!'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    body: ''
  }
];

function GanttChart() {
  const [jobs, setJobs] = useState(mockJobs);
  const [freelancers, setFreelancers] = useState(initialFreelancers);
  const [modal, setModal] = useState({ open: false, jobIdx: null, setIdx: null, resIdx: null, needIdx: null });
  const [collapsed, setCollapsed] = useState({});
  const [newFreelancer, setNewFreelancer] = useState({ name: '', type: '' });
  const [addError, setAddError] = useState('');
  // Multi-select and request state
  const [selectedFreelancers, setSelectedFreelancers] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
  const [step, setStep] = useState('select'); // 'select' | 'status'
  // Email template state
  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0].id);
  const [emailBody, setEmailBody] = useState(emailTemplates[0].body);
  // Track requests per labor need (by job/set/resource/need index)
  const [needRequests, setNeedRequests] = useState({}); // key: jobIdx-setIdx-resIdx-needIdx, value: { names: [], status: {} }
  // Row selection state
  const [selectedRow, setSelectedRow] = useState(null); // { jobIdx, setIdx, resIdx, needIdx }
  const [splitDialog, setSplitDialog] = useState(null); // { jobIdx, setIdx, resIdx, needIdx, days }
  const [splitValue, setSplitValue] = useState(1);
  // Special notes state
  const [specialNotes, setSpecialNotes] = useState('');

  const openAssignModal = (jobIdx, setIdx, resIdx, needIdx) => {
    setModal({ open: true, jobIdx, setIdx, resIdx, needIdx });
    setNewFreelancer({ name: '', type: '' });
    setAddError('');
    setSelectedFreelancers([]);
    setRequestStatus({});
    setStep('select');
  };

  const closeModal = () => setModal({ open: false, jobIdx: null, setIdx: null, resIdx: null, needIdx: null });

  const assignFreelancer = (freelancer) => {
    setJobs(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const { jobIdx, setIdx, resIdx, needIdx } = modal;
      updated[jobIdx].sets[setIdx].resources[resIdx].needs[needIdx].assigned = freelancer.name;
      return updated;
    });
    // Remove requests for this need
    if (modal.open) {
      const { jobIdx, setIdx, resIdx, needIdx } = modal;
      const key = `${jobIdx}-${setIdx}-${resIdx}-${needIdx}`;
      setNeedRequests(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
    closeModal();
  };

  // Collapsing logic
  const toggleCollapse = (type, key) => {
    setCollapsed(prev => ({ ...prev, [type + key]: !prev[type + key] }));
  };

  // Helper to get colSpan for group rows
  const colSpan = 6 + dateRange.length;

  // Get resource type for current assignment
  let resourceType = '';
  if (modal.open) {
    const { jobIdx, setIdx, resIdx } = modal;
    if (jobIdx !== null && setIdx !== null && resIdx !== null) {
      resourceType = jobs[jobIdx].sets[setIdx].resources[resIdx].type;
    }
  }
  const matchingFreelancers = freelancers.filter(f => f.type === resourceType);

  // Add new freelancer logic
  const handleAddFreelancer = (e) => {
    e.preventDefault();
    if (!newFreelancer.name.trim()) {
      setAddError('Name is required');
      return;
    }
    if (!resourceType) {
      setAddError('Resource type is required');
      return;
    }
    // Add new freelancer and select them
    const newF = { name: newFreelancer.name.trim(), type: resourceType };
    setFreelancers(prev => [...prev, newF]);
    setSelectedFreelancers(prev => [...prev, newF.name]);
    setRequestStatus(prev => ({ ...prev, [newF.name]: 'Pending' }));
    setNewFreelancer({ name: '', type: '' });
    setAddError('');
  };

  // Send requests to selected freelancers
  const handleSendRequests = () => {
    const status = {};
    selectedFreelancers.forEach(name => {
      status[name] = 'Pending';
    });
    setRequestStatus(status);
    setStep('status');
    // Save to needRequests for Gantt chart display
    if (modal.open) {
      const { jobIdx, setIdx, resIdx, needIdx } = modal;
      const key = `${jobIdx}-${setIdx}-${resIdx}-${needIdx}`;
      setNeedRequests(prev => ({
        ...prev,
        [key]: { names: [...selectedFreelancers], status: { ...status } }
      }));
    }
  };

  // For demo: toggle status between Pending, Accepted, Rejected
  const toggleStatus = (name) => {
    setRequestStatus(prev => {
      const curr = prev[name];
      let next = 'Pending';
      if (curr === 'Pending') next = 'Accepted';
      else if (curr === 'Accepted') next = 'Rejected';
      else if (curr === 'Rejected') next = 'Pending';
      // Also update needRequests
      if (modal.open) {
        const { jobIdx, setIdx, resIdx, needIdx } = modal;
        const key = `${jobIdx}-${setIdx}-${resIdx}-${needIdx}`;
        setNeedRequests(prevReqs => {
          if (!prevReqs[key]) return prevReqs;
          return {
            ...prevReqs,
            [key]: {
              ...prevReqs[key],
              status: { ...prevReqs[key].status, [name]: next }
            }
          };
        });
      }
      return { ...prev, [name]: next };
    });
  };

  // Only allow assign if at least one is accepted
  const canAssign = Object.values(requestStatus).includes('Accepted');

  // When template changes, update email body (unless custom)
  const handleTemplateChange = (e) => {
    const id = e.target.value;
    setSelectedTemplate(id);
    const template = emailTemplates.find(t => t.id === id);
    setEmailBody(template ? template.body : '');
  };

  // Delete row
  const handleDeleteRow = () => {
    if (!selectedRow) return;
    const { jobIdx, setIdx, resIdx, needIdx } = selectedRow;
    setJobs(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      updated[jobIdx].sets[setIdx].resources[resIdx].needs.splice(needIdx, 1);
      return updated;
    });
    setSelectedRow(null);
  };

  // Add new row below
  const handleAddRowBelow = () => {
    if (!selectedRow) return;
    const { jobIdx, setIdx, resIdx, needIdx } = selectedRow;
    setJobs(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const current = updated[jobIdx].sets[setIdx].resources[resIdx].needs[needIdx];
      const newRow = {
        task: '',
        skill: '',
        assigned: '',
        days: [...current.days],
        times: { ...current.times },
      };
      updated[jobIdx].sets[setIdx].resources[resIdx].needs.splice(needIdx + 1, 0, newRow);
      return updated;
    });
    setSelectedRow(null);
  };

  // Split row dialog open
  const handleSplitRow = () => {
    if (!selectedRow) return;
    const { jobIdx, setIdx, resIdx, needIdx } = selectedRow;
    const current = jobs[jobIdx].sets[setIdx].resources[resIdx].needs[needIdx];
    setSplitDialog({ jobIdx, setIdx, resIdx, needIdx, days: [...current.days] });
    setSplitValue(1);
  };

  // Confirm split
  const handleConfirmSplit = () => {
    if (!splitDialog) return;
    const { jobIdx, setIdx, resIdx, needIdx, days } = splitDialog;
    const splitAt = splitValue;
    setJobs(prev => {
      const updated = JSON.parse(JSON.stringify(prev));
      const current = updated[jobIdx].sets[setIdx].resources[resIdx].needs[needIdx];
      const firstDays = days.slice(0, splitAt);
      const lastDays = days.slice(splitAt);
      const newRows = [
        { ...current, assigned: '', days: firstDays },
        { ...current, assigned: '', days: lastDays },
      ];
      updated[jobIdx].sets[setIdx].resources[resIdx].needs.splice(needIdx, 1, ...newRows);
      return updated;
    });
    setSplitDialog(null);
    setSelectedRow(null);
  };

  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid #aaa', mt: 2 }}>
      {/* Action bar for selected row (now above the table) */}
      {selectedRow && !splitDialog && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ my: 2 }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteRow}
          >
            Delete
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddRowBelow}
          >
            Add New Row Below
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ContentCutIcon />}
            onClick={handleSplitRow}
          >
            Split Row
          </Button>
        </Stack>
      )}
      <TableContainer component={Paper} sx={{ minWidth: 800 }}>
        <Table size="small" aria-label="gantt chart">
          <TableHead>
            <TableRow>
              <TableCell sx={{ background: '#222', color: '#fff', border: '1px solid #888' }}>Task</TableCell>
              <TableCell sx={{ background: '#222', color: '#fff', border: '1px solid #888' }}>Skill Set</TableCell>
              <TableCell sx={{ background: '#222', color: '#fff', border: '1px solid #888' }}>Assigned</TableCell>
              {dateRange.map(date => (
                <TableCell key={date} sx={{ background: '#222', color: '#fff', border: '1px solid #888' }}>{date}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job, jobIdx) => (
              <React.Fragment key={job.jobNumber}>
                {/* Job Group Row */}
                <TableRow sx={{ background: '#263238' }}>
                  <TableCell colSpan={3 + dateRange.length} sx={{ color: '#fff', fontWeight: 'bold', border: '1px solid #888', fontSize: 17, textAlign: 'left' }}>
                    <IconButton size="small" onClick={() => toggleCollapse('job', job.jobNumber)} sx={{ mr: 1, background: '#fff', color: '#263238', border: '1px solid #888', fontWeight: 'bold' }}>
                      {collapsed['job' + job.jobNumber] ? <AddIcon /> : <RemoveIcon />}
                    </IconButton>
                    Job: {job.jobNumber}
                  </TableCell>
                </TableRow>
                {!collapsed['job' + job.jobNumber] && job.sets.map((set, setIdx) => (
                  <React.Fragment key={set.name}>
                    {/* Set/Room Group Row */}
                    <TableRow sx={{ background: '#37474f' }}>
                      <TableCell colSpan={3 + dateRange.length} sx={{ color: '#fff', fontWeight: 'bold', border: '1px solid #888', fontSize: 16, pl: 4, textAlign: 'left' }}>
                        <IconButton size="small" onClick={() => toggleCollapse('set', job.jobNumber + set.name)} sx={{ mr: 1, background: '#fff', color: '#37474f', border: '1px solid #888', fontWeight: 'bold' }}>
                          {collapsed['set' + job.jobNumber + set.name] ? <AddIcon /> : <RemoveIcon />}
                        </IconButton>
                        Set/Room: {set.name}
                      </TableCell>
                    </TableRow>
                    {!collapsed['set' + job.jobNumber + set.name] && set.resources.map((resource, resIdx) => (
                      <React.Fragment key={resource.type}>
                        {/* Resource Type Group Row */}
                        <TableRow sx={{ background: '#455a64' }}>
                          <TableCell colSpan={3 + dateRange.length} sx={{ color: '#fff', fontWeight: 'bold', border: '1px solid #888', fontSize: 15, pl: 8, textAlign: 'left' }}>
                            <IconButton size="small" onClick={() => toggleCollapse('res', job.jobNumber + set.name + resource.type)} sx={{ mr: 1, background: '#fff', color: '#455a64', border: '1px solid #888', fontWeight: 'bold' }}>
                              {collapsed['res' + job.jobNumber + set.name + resource.type] ? <AddIcon /> : <RemoveIcon />}
                            </IconButton>
                            Resource Type: {resource.type}
                          </TableCell>
                        </TableRow>
                        {!collapsed['res' + job.jobNumber + set.name + resource.type] && resource.needs.map((need, needIdx) => {
                          const key = `${jobIdx}-${setIdx}-${resIdx}-${needIdx}`;
                          const req = needRequests[key];
                          let assignedCell = null;
                          if (need.assigned) {
                            assignedCell = need.assigned;
                          } else if (req && req.names.length > 0) {
                            // Count responded (Accepted/Rejected)
                            const responded = Object.values(req.status).filter(s => s !== 'Pending').length;
                            assignedCell = (
                              <Typography color="primary" fontWeight="bold">
                                Requests: {responded}/{req.names.length} responded
                              </Typography>
                            );
                          }
                          const isSelected = selectedRow && selectedRow.jobIdx === jobIdx && selectedRow.setIdx === setIdx && selectedRow.resIdx === resIdx && selectedRow.needIdx === needIdx;
                          return (
                            <TableRow key={need.task + needIdx} selected={isSelected} sx={isSelected ? { background: '#e3f2fd' } : {}}>
                              <TableCell sx={{ border: '1px solid #888', background: '#fff', color: '#111', fontWeight: 'bold' }}>
                                <Radio
                                  checked={isSelected}
                                  onChange={() => setSelectedRow({ jobIdx, setIdx, resIdx, needIdx })}
                                  value={isSelected}
                                  name="row-select"
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                {need.task}
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #888', background: '#fff', color: '#111', fontWeight: 'bold' }}>{need.skill}</TableCell>
                              <TableCell sx={{ border: '1px solid #888', background: '#fff', color: '#111', fontWeight: 'bold' }}>
                                {assignedCell || (
                                  <Button size="small" variant="outlined" onClick={() => openAssignModal(jobIdx, setIdx, resIdx, needIdx)}>
                                    Assign
                                  </Button>
                                )}
                              </TableCell>
                              {dateRange.map((date, i) => {
                                const isAssigned = need.days.includes(i + 1) && need.assigned;
                                return (
                                  <TableCell
                                    key={date}
                                    sx={{
                                      background: isAssigned ? '#1976d2' : '#eee',
                                      color: isAssigned ? '#fff' : '#222',
                                      border: '1px solid #888',
                                      textAlign: 'center',
                                      fontWeight: isAssigned ? 'bold' : 'normal',
                                    }}
                                  >
                                    {need.days.includes(i + 1) && need.assigned
                                      ? `${need.times && need.times[i + 1] ? need.times[i + 1][0] + '-' + need.times[i + 1][1] : '●'}`
                                      : ''}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Split dialog */}
      {splitDialog && (
        <Dialog open={!!splitDialog} onClose={() => setSplitDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Split Row</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>How many days for the first row?</Typography>
            <TextField
              type="number"
              inputProps={{ min: 1, max: splitDialog.days.length - 1 }}
              value={splitValue}
              onChange={e => setSplitValue(Number(e.target.value))}
              sx={{ width: 100, mr: 2 }}
              label={`Out of ${splitDialog.days.length} days`}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleConfirmSplit} variant="contained" color="primary">Confirm</Button>
            <Button onClick={() => setSplitDialog(null)} variant="contained" color="error">Cancel</Button>
          </DialogActions>
        </Dialog>
      )}
      {/* Assign modal */}
      {modal.open && (
        <Dialog open={modal.open} onClose={closeModal} maxWidth="xl" fullWidth>
          <DialogTitle>
            Assign Freelancer
            <Button onClick={closeModal} sx={{ position: 'absolute', right: 16, top: 16 }} color="inherit">×</Button>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} alignItems="flex-start">
              {/* Assignment selection (left) */}
              <Grid item xs={12} md={4}>
                {step === 'select' && (
                  <Box>
                    <Typography fontWeight={700} mb={1}>Select Freelancers</Typography>
                    {matchingFreelancers.length > 0 ? (
                      <Box>
                        {matchingFreelancers.map(f => (
                          <FormControlLabel
                            key={f.name}
                            control={
                              <Checkbox
                                checked={selectedFreelancers.includes(f.name)}
                                onChange={e => {
                                  if (e.target.checked) setSelectedFreelancers(prev => [...prev, f.name]);
                                  else setSelectedFreelancers(prev => prev.filter(n => n !== f.name));
                                }}
                              />
                            }
                            label={`${f.name} (${f.type})`}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography color="error" my={2}>No available freelancers for this talent type.</Typography>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Typography fontWeight={700} mb={1}>Add New Freelancer</Typography>
                    <Box component="form" onSubmit={handleAddFreelancer} sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <TextField
                        size="small"
                        placeholder="Name"
                        value={newFreelancer.name}
                        onChange={e => setNewFreelancer({ ...newFreelancer, name: e.target.value, type: resourceType })}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        value={resourceType}
                        disabled
                        sx={{ width: 100 }}
                      />
                      <Button type="submit" variant="contained" color="primary">Add</Button>
                    </Box>
                    {addError && <Typography color="error" variant="body2">{addError}</Typography>}
                    <Button
                      onClick={handleSendRequests}
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={selectedFreelancers.length === 0}
                    >
                      Send Requests
                    </Button>
                  </Box>
                )}
                {step === 'status' && (
                  <Box>
                    <Typography fontWeight={700} mb={1}>Request Status</Typography>
                    <Box>
                      {selectedFreelancers.map(name => (
                        <Box key={name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography sx={{ width: 120 }}>{name}</Typography>
                          <Chip
                            label={requestStatus[name]}
                            color={requestStatus[name] === 'Accepted' ? 'success' : requestStatus[name] === 'Rejected' ? 'error' : 'default'}
                            sx={{ mx: 1 }}
                          />
                          <Button size="small" variant="outlined" onClick={() => toggleStatus(name)} sx={{ mr: 1 }}>Toggle Status</Button>
                          {requestStatus[name] === 'Accepted' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => assignFreelancer(freelancers.find(f => f.name === name))}
                              sx={{ ml: 1 }}
                            >
                              Assign
                            </Button>
                          )}
                        </Box>
                      ))}
                    </Box>
                    <Button onClick={closeModal} variant="contained" color="inherit" fullWidth sx={{ mt: 2 }}>Cancel</Button>
                  </Box>
                )}
              </Grid>
              {/* Job details (center) */}
              <Grid item xs={12} md={4}>
                {step === 'select' && modal.open && (() => {
                  const { jobIdx, setIdx, resIdx, needIdx } = modal;
                  if (jobIdx == null || setIdx == null || resIdx == null || needIdx == null) return null;
                  const job = jobs[jobIdx];
                  const need = jobs[jobIdx].sets[setIdx].resources[resIdx].needs[needIdx];
                  // Get all days and times for this assignment
                  const days = need.days;
                  const times = need.times || {};
                  return (
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                      <Typography fontWeight={700} mb={1}>Assignment Details</Typography>
                      <Typography variant="body2"><b>Job Number:</b> {job.jobNumber}</Typography>
                      <Typography variant="body2"><b>Date Range:</b> {days.map(d => dateRange[d - 1]).join(', ')}</Typography>
                      <Typography variant="body2" mb={1}><b>Start/End Times:</b></Typography>
                      <Box component="ul" sx={{ pl: 3, mt: 0, mb: 1 }}>
                        {days.map(d => (
                          <li key={d}>
                            <Typography variant="body2">
                              {dateRange[d - 1]}: {times[d] ? `${times[d][0]} - ${times[d][1]}` : 'N/A'}
                            </Typography>
                          </li>
                        ))}
                      </Box>
                      <Typography variant="body2" mb={0.5}><b>Special Notes:</b></Typography>
                      <TextField
                        value={specialNotes}
                        onChange={e => setSpecialNotes(e.target.value)}
                        multiline
                        minRows={2}
                        placeholder="e.g. Dress code, parking info, etc."
                        fullWidth
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  );
                })()}
              </Grid>
              {/* Email section (right) */}
              <Grid item xs={12} md={4}>
                {step === 'select' && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                    <Typography fontWeight={700} mb={1}>Email Notification</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography component="label" htmlFor="email-template" sx={{ mr: 1 }}>Template:</Typography>
                      <Select
                        id="email-template"
                        value={selectedTemplate}
                        onChange={handleTemplateChange}
                        size="small"
                        sx={{ minWidth: 180 }}
                      >
                        {emailTemplates.map(t => (
                          <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                        ))}
                      </Select>
                    </Box>
                    <TextField
                      id="email-body"
                      value={emailBody}
                      onChange={e => setEmailBody(e.target.value)}
                      multiline
                      minRows={5}
                      fullWidth
                    />
                  </Paper>
                )}
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

export default GanttChart; 