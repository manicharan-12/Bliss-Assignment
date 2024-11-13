import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNotifications } from '../hooks/useNotifications';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2980b9;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const AssignmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const AssignmentCard = styled.div`
  background-color: ${props => props.completed ? '#e6ffe6' : 'white'};
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }
`;

const AssignmentTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const AssignmentInfo = styled.p`
  margin-bottom: 0.5rem;
  color: #555;
`;

const DueWarning = styled.p`
  color: #e74c3c;
  font-weight: bold;
  margin-top: 0.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const StatusButton = styled(Button)`
  background-color: ${props => props.completed ? '#e74c3c' : '#2ecc71'};

  &:hover {
    background-color: ${props => props.completed ? '#c0392b' : '#27ae60'};
  }
`;

const DeleteButton = styled(Button)`
  background-color: #e74c3c;

  &:hover {
    background-color: #c0392b;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const AssignmentList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useLocalStorage(`assignments-${courseId}`, []);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    due_date: '',
    status: 'pending'
  });
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('due_date');
  const [loading, setLoading] = useState(true);

  useNotifications(assignments);

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/assignments/course/${courseId}`);
      setAssignments(response.data);
    } catch (error) {
      toast.error('Error fetching assignments');
      const cachedAssignments = localStorage.getItem(`assignments-${courseId}`);
      if (cachedAssignments) {
        setAssignments(JSON.parse(cachedAssignments));
        toast.info('Using cached data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/assignments', {
        ...formData,
        course_id: courseId
      });
      setAssignments([...assignments, response.data]);
      setShowModal(false);
      toast.success('Assignment added successfully');
    } catch (error) {
      toast.error('Error adding assignment');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/assignments/${id}`, {
        status: newStatus
      });
      const updatedAssignments = assignments.map(assignment =>
        assignment._id === id ? { ...assignment, status: newStatus } : assignment
      );
      setAssignments(updatedAssignments);
      toast.success('Assignment status updated');
    } catch (error) {
      toast.error('Error updating assignment status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`http://localhost:5000/api/assignments/${id}`);
        const updatedAssignments = assignments.filter(assignment => assignment._id !== id);
        setAssignments(updatedAssignments);
        toast.success('Assignment deleted successfully');
      } catch (error) {
        toast.error('Error deleting assignment');
      }
    }
  };

  const filteredAndSortedAssignments = assignments
    .filter(assignment => filter === 'all' ? true : assignment.status === filter)
    .sort((a, b) => {
      if (sortBy === 'due_date') {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      return 0;
    });

  if (loading) {
    return (
      <div>Loading...</div>
    );
  }

  return (
    <Container>
      <Header>
        <Button onClick={() => navigate('/')}>Back to Courses</Button>
        <Button onClick={() => setShowModal(true)}>Add Assignment</Button>
      </Header>

      <FilterContainer>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </Select>

        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="due_date">Sort by Due Date</option>
        </Select>
      </FilterContainer>

      <AssignmentGrid>
        {filteredAndSortedAssignments.map((assignment) => (
          <AssignmentCard key={assignment._id} completed={assignment.status === 'completed'}>
            <AssignmentTitle>{assignment.title}</AssignmentTitle>
            <AssignmentInfo>Due Date: {format(new Date(assignment.due_date), 'PP')}</AssignmentInfo>
            <AssignmentInfo>Status: {assignment.status}</AssignmentInfo>
            
            {new Date(assignment.due_date) - new Date() <= 86400000 && 
             assignment.status !== 'completed' && (
              <DueWarning>Due within 24 hours!</DueWarning>
            )}
            
            <ButtonGroup>
              <StatusButton
                completed={assignment.status === 'completed'}
                onClick={() => handleStatusChange(
                  assignment._id,
                  assignment.status === 'pending' ? 'completed' : 'pending'
                )}
              >
                {assignment.status === 'pending' ? 'Mark Complete' : 'Mark Pending'}
              </StatusButton>
              <DeleteButton onClick={() => handleDelete(assignment._id)}>
                Delete
              </DeleteButton>
            </ButtonGroup>
          </AssignmentCard>
        ))}
      </AssignmentGrid>

      {showModal && (
        <Modal>
          <ModalContent>
            <h3>Add New Assignment</h3>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Title</Label>
                <Input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormGroup>
              <ButtonGroup>
                <Button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default AssignmentList;