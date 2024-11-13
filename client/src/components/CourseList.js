import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { useLocalStorage } from '../hooks/useLocalStorage';
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

const Title = styled.h2`
  font-size: 2rem;
  font-weight: bold;
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

const CourseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const CourseCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }
`;

const CourseTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
`;

const CourseInfo = styled.p`
  margin-bottom: 0.5rem;
  color: #555;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
`;

const ViewButton = styled(Button)`
  background-color: #2ecc71;

  &:hover {
    background-color: #27ae60;
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

const CourseList = () => {
  const [courses, setCourses] = useLocalStorage('courses', []);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    course_name: '',
    professor: '',
    start_date: '',
    end_date: ''
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/courses');
      setCourses(response.data);
    } catch (error) {
      toast.error('Error fetching courses');
      const cachedCourses = localStorage.getItem('courses');
      if (cachedCourses) {
        setCourses(JSON.parse(cachedCourses));
        toast.info('Using cached data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/courses', formData);
      setShowModal(false);
      fetchCourses();
      toast.success('Course added successfully');
    } catch (error) {
      toast.error('Error adding course');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`http://localhost:5000/api/courses/${id}`);
        fetchCourses();
        toast.success('Course deleted successfully');
      } catch (error) {
        toast.error('Error deleting course');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Courses</Title>
        <Button onClick={() => setShowModal(true)}>Add Course</Button>
      </Header>

      <CourseGrid>
        {courses.map((course) => (
          <CourseCard key={course._id}>
            <CourseTitle>{course.course_name}</CourseTitle>
            <CourseInfo>Professor: {course.professor || 'N/A'}</CourseInfo>
            <CourseInfo>Start Date: {format(new Date(course.start_date), 'PP')}</CourseInfo>
            <CourseInfo>End Date: {format(new Date(course.end_date), 'PP')}</CourseInfo>
            <ButtonGroup>
              <ViewButton onClick={() => navigate(`/assignments/${course._id}`)}>
                View Assignments
              </ViewButton>
              <DeleteButton onClick={() => handleDelete(course._id)}>
                Delete
              </DeleteButton>
            </ButtonGroup>
          </CourseCard>
        ))}
      </CourseGrid>

      {showModal && (
        <Modal>
          <ModalContent>
            <h3>Add New Course</h3>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Course Name</Label>
                <Input
                  type="text"
                  required
                  value={formData.course_name}
                  onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Professor</Label>
                <Input
                  type="text"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </FormGroup>
              <FormGroup>
                <Label>End Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
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

export default CourseList;