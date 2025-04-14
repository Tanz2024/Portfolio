import React, { useState, useEffect, useCallback } from 'react';
import './Works.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Work = () => {
  // State variables
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState('');
  const [newProject, setNewProject] = useState({
    title: '',
    year: '',
    category: '',
    description: '',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewItems, setPreviewItems] = useState([]);
  const [modal, setModal] = useState({
    open: false,
    items: [],
    currentIndex: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editProjectId, setEditProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState({});

  // Fetch projects from backend
  useEffect(() => {
    setLoadingProjects(true);
    fetch('https://portfolio-1-716m.onrender.com/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setFilteredProjects(data);
        setLoadingProjects(false);
      })
      .catch(err => {
        setErrorProjects('Failed to load projects');
        setLoadingProjects(false);
      });
  }, []);

  // Check admin authentication
  useEffect(() => {
    fetch('https://portfolio-1-716m.onrender.com/authenticate', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.role_id === 1) {
          setIsAdmin(true);
        }
      })
      .catch(err => console.error('Admin auth failed', err));
  }, []);

  // Filter projects whenever search/filter changes or projects update
  useEffect(() => {
    let filtered = projects.filter(proj =>
      proj.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (yearFilter) {
      filtered = filtered.filter(proj => proj.year === yearFilter);
    }
    if (categoryFilter) {
      filtered = filtered.filter(proj => proj.category === categoryFilter);
    }
    setFilteredProjects(filtered);
  }, [projects, searchTerm, yearFilter, categoryFilter]);

  // Update new project text fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({ ...prev, [name]: value }));
  };

  // Update file preview removal (for new project files)
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Check file size limit
    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 5MB size limit.`);
        return false;
      }
      return true;
    });

    if (!window.confirm("Add selected files?")) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);

    const newPreviews = validFiles.map(file => {
      const fileURL = URL.createObjectURL(file);
      const isPdf = file.type === 'application/pdf';
      return { url: fileURL, isPdf, name: file.name };
    });
    setPreviewItems(prev => [...prev, ...newPreviews]);
  };

  // Remove file from previews and selectedFiles
  const handleRemoveFile = (index) => {
    if (!window.confirm("Remove this file?")) return;
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewItems(prev => prev.filter((_, i) => i !== index));
  };

  // Submit new project via FormData
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!newProject.title.trim() || !newProject.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    if (!window.confirm("Submit this project?")) return;

    try {
      const formData = new FormData();
      formData.append('title', newProject.title);
      formData.append('year', newProject.year);
      formData.append('category', newProject.category);
      formData.append('description', newProject.description);
      selectedFiles.forEach(file => formData.append('screenshots', file));

      const response = await fetch('https://portfolio-1-716m.onrender.com/api/projects', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to upload project');
      }
      const savedProject = await response.json();
      setProjects(prev => [savedProject, ...prev]);
      toast.success('Project uploaded successfully!');
      // Reset form fields and previews
      setNewProject({ title: '', year: '', category: '', description: '' });
      setSelectedFiles([]);
      setPreviewItems([]);
    } catch (err) {
      toast.error('Failed to upload project: ' + err.message);
    }
  };

  // Delete a project (admin only)
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`https://portfolio-1-716m.onrender.com/api/projects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete project');
      }
      setProjects(prev => prev.filter(proj => proj.id !== id));
      toast.success('Project deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete project: ' + err.message);
    }
  };

  // Toggle edit mode for a project (admin only)
  const handleEditProject = (project) => {
    setEditProjectId(project.id);
    setEditProjectData({ ...project });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditProjectData(prev => ({ ...prev, [name]: value }));
  };

  const submitEditProject = async (e) => {
    e.preventDefault();
    if (!window.confirm("Save changes?")) return;
    try {
      const response = await fetch(`https://portfolio-1-716m.onrender.com/api/projects/${editProjectId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProjectData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update project');
      }
      const updatedProject = await response.json();
      setProjects(prev =>
        prev.map(proj => (proj.id === editProjectId ? updatedProject : proj))
      );
      setEditProjectId(null);
      toast.success('Project updated successfully!');
    } catch (err) {
      toast.error('Failed to update project: ' + err.message);
    }
  };

  // Open modal with navigation (accept an array of items and starting index)
  const openModal = (items, index = 0) => {
    setModal({ open: true, items, currentIndex: index });
  };

  // Modal navigation functions
  const nextModalItem = () => {
    setModal(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.items.length,
    }));
  };

  const prevModalItem = () => {
    setModal(prev => ({
      ...prev,
      currentIndex:
        (prev.currentIndex - 1 + prev.items.length) % prev.items.length,
    }));
  };

  const closeModal = () => {
    setModal({ open: false, items: [], currentIndex: 0 });
  };

  // Keyboard support for modal
  const handleKeyDown = useCallback((e) => {
    if (!modal.open) return;
    if (e.key === 'ArrowRight') {
      nextModalItem();
    } else if (e.key === 'ArrowLeft') {
      prevModalItem();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }, [modal]);

  useEffect(() => {
    if (modal.open) {
      window.addEventListener('keydown', handleKeyDown);
    } else {
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal.open, handleKeyDown]);

  // Get unique years and categories for filters
  const uniqueYears = [...new Set(projects.map(proj => proj.year).filter(Boolean))];
  const uniqueCategories = [...new Set(projects.map(proj => proj.category).filter(Boolean))];

  return (
    <div className="work">
      <ToastContainer />
      <header className="work-header">
        <h1>Explore my projects</h1>
        <p>A blend of innovation, expertise, and creativity.</p>
        <div className="filter-container">
          <input
            type="text"
            placeholder="Search by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
            <option value="">All Years</option>
            {uniqueYears.map((year, index) => (
              <option key={index} value={year}>{year}</option>
            ))}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {uniqueCategories.map((cat, index) => (
              <option key={index} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="work-main">
        {/* Projects List */}
        <section className="projects">
          <h2>Projects</h2>
          {loadingProjects ? (
            <div className="spinner">Loading projects...</div>
          ) : errorProjects ? (
            <div className="error">{errorProjects}</div>
          ) : filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <article key={project.id} className="project-card">
                <div className="project-image-col">
                  {/* Single image preview */}
                  {project.image_url && !project.screenshots && (
                    <img
                      className="project-image"
                      src={
                        project.image_url.startsWith('/uploads')
                          ? `https://portfolio-1-716m.onrender.com${project.image_url}`
                          : project.image_url
                      }
                      alt={project.title}
                      onClick={() =>
                        openModal([{ url: project.image_url.startsWith('/uploads')
                          ? `https://portfolio-1-716m.onrender.com${project.image_url}`
                          : project.image_url, isPdf: false }])
                      }
                    />
                  )}
                  {/* Multiple screenshots preview */}
                  {project.screenshots && (
                    <div className="project-screenshots">
                      {JSON.parse(project.screenshots).map((fileUrl, index) => {
                        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                        const item = {
                          url: `https://portfolio-1-716m.onrender.com${fileUrl}`,
                          isPdf
                        };
                        return (
                          <div key={index} className="file-preview">
                            {isPdf ? (
                              <iframe
                                src={item.url}
                                title={`PDF-${index}`}
                                width="100%"
                                height="250px"
                                style={{ border: 'none' }}
                                onClick={() => openModal(JSON.parse(project.screenshots).map(url => ({
                                  url: `https://portfolio-1-716m.onrender.com${url}`,
                                  isPdf: url.toLowerCase().endsWith('.pdf')
                                })), index)}
                              ></iframe>
                            ) : (
                              <img
                                className="project-image"
                                src={item.url}
                                alt={`${project.title} file ${index + 1}`}
                                onClick={() => openModal(JSON.parse(project.screenshots).map(url => ({
                                  url: `https://portfolio-1-716m.onrender.com${url}`,
                                  isPdf: url.toLowerCase().endsWith('.pdf')
                                })), index)}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="project-content-col">
                  <div className="project-meta">
                    {project.year && <span className="year-badge">{project.year}</span>}
                    {project.category && <span className="category-badge">{project.category}</span>}
                  </div>
                  {editProjectId === project.id ? (
                    <form onSubmit={submitEditProject}>
                      <input
                        type="text"
                        name="title"
                        value={editProjectData.title}
                        onChange={handleEditInputChange}
                        required
                      />
                      <textarea
                        name="description"
                        value={editProjectData.description}
                        onChange={handleEditInputChange}
                        required
                      />
                      <button type="submit">Save</button>
                      <button type="button" onClick={() => setEditProjectId(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <h3 className="project-title">
                        {project.title}
                        {isAdmin && (
                          <>
                            <button
                              className="edit-button"
                              onClick={() => handleEditProject(project)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </h3>
                      <p className="project-description">{project.description}</p>
                    </>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p>No projects found. Upload your first one!</p>
          )}
        </section>

        {/* Upload Form (Admin Only) */}
        {isAdmin && (
          <section className="upload-form">
            <h2>Upload New Project</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  name="title"
                  value={newProject.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Year:</label>
                <input
                  type="text"
                  name="year"
                  value={newProject.year}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Category:</label>
                <input
                  type="text"
                  name="category"
                  value={newProject.category}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={newProject.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Images / PDFs:</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileChange}
                />
              </div>

              {/* Previews with remove buttons */}
              {previewItems.length > 0 && (
                <div className="preview-container">
                  <h4>Preview:</h4>
                  <div className="preview-grid">
                    {previewItems.map((item, index) => (
                      <div key={index} className="preview-item">
                        <div className="preview-remove">
                          <button onClick={() => handleRemoveFile(index)}>×</button>
                        </div>
                        {item.isPdf ? (
                          <iframe
                            src={item.url}
                            title={`Preview PDF ${index}`}
                            width="150px"
                            height="200px"
                            style={{ border: '1px solid #ccc' }}
                            onClick={() => openModal(previewItems, index)}
                          ></iframe>
                        ) : (
                          <img
                            src={item.url}
                            alt={`Preview ${index + 1}`}
                            className="preview-image"
                            onClick={() => openModal(previewItems, index)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit">Add Project</button>
            </form>
          </section>
        )}
      </main>

      {/* Modal for full-screen preview with navigation */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {modal.items[modal.currentIndex].isPdf ? (
              <iframe
                src={modal.items[modal.currentIndex].url}
                title="Full PDF Preview"
                style={{ width: '100%', height: '100%' }}
              ></iframe>
            ) : (
              <img
                src={modal.items[modal.currentIndex].url}
                alt="Full Preview"
                className="modal-image"
              />
            )}
            <button className="modal-close" onClick={closeModal}>
              &times;
            </button>
            {modal.items.length > 1 && (
              <>
                <button className="modal-prev" onClick={prevModalItem}>
                  &#8592;
                </button>
                <button className="modal-next" onClick={nextModalItem}>
                  &#8594;
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Work;
