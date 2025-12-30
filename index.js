document.addEventListener('DOMContentLoaded', () => {
    // --- Admin Mode Logic ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
        localStorage.setItem('admin_mode', 'true');
    } else if (urlParams.get('admin') === 'false') {
        localStorage.removeItem('admin_mode');
    }
    const isAdmin = localStorage.getItem('admin_mode') === 'true';
    if (isAdmin) {
        document.body.classList.add('admin-mode');
    }

    // --- Secret Admin Trigger ---
    const logo = document.querySelector('.logo');
    let logoClicks = 0;
    let logoClickTimer;

    logo.addEventListener('click', () => {
        logoClicks++;
        clearTimeout(logoClickTimer);
        logoClickTimer = setTimeout(() => {
            logoClicks = 0;
        }, 1000);

        if (logoClicks === 3) {
            const newState = !isAdmin;
            if (newState) {
                localStorage.setItem('admin_mode', 'true');
                alert('Admin Mode Enabled');
            } else {
                localStorage.removeItem('admin_mode');
                alert('Admin Mode Disabled');
            }
            location.reload();
        }
    });

    // --- Profile Image Logic ---
    const profileUpload = document.getElementById('profile-upload');
    const profileImgContainer = document.querySelector('.profile-img-container');
    const profileImg = profileImgContainer.querySelector('img');
    const cropModal = document.getElementById('crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const saveCropBtn = document.getElementById('save-crop');
    const cancelCropBtn = document.getElementById('cancel-crop');
    let cropper = null;

    // Load saved image
    const savedProfileImg = localStorage.getItem('profile_image');
    if (savedProfileImg) {
        profileImg.src = savedProfileImg;
    }

    // Click profile to upload
    profileImgContainer.addEventListener('click', () => {
        if (isAdmin) {
            profileUpload.click();
        }
    });

    // Handle file selection
    profileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageToCrop.src = e.target.result;
                cropModal.classList.add('active');

                // Initialize Cropper
                if (cropper) cropper.destroy();
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1,
                    viewMode: 1,
                    minContainerWidth: 300,
                    minContainerHeight: 300
                });
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file selection triggers change again if needed
        profileUpload.value = '';
    });

    // Save Crop
    saveCropBtn.addEventListener('click', () => {
        if (!cropper) return;

        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas({
            width: 300,
            height: 300
        });

        // Convert to base64
        const croppedImage = canvas.toDataURL('image/png');

        // Save and Update
        localStorage.setItem('profile_image', croppedImage);
        profileImg.src = croppedImage;

        // Cleanup
        closeCropModal();
    });

    // Cancel Crop
    cancelCropBtn.addEventListener('click', closeCropModal);

    function closeCropModal() {
        cropModal.classList.remove('active');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    }

    // --- Navigation & Mobile Menu ---
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuBtn.querySelector('i').classList.toggle('fa-times');
        menuBtn.querySelector('i').classList.toggle('fa-bars');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuBtn.querySelector('i').classList.remove('fa-times');
            menuBtn.querySelector('i').classList.add('fa-bars');
        });
    });

    // --- Theme Toggle ---
    const themeToggle = document.querySelector('.theme-toggle');
    const themeIcon = themeToggle.querySelector('i');

    // Check saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        applyLightModeStyles();
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');

        if (isLight) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'light');
            applyLightModeStyles();
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'dark');
            removeLightModeStyles();
        }
    });

    function applyLightModeStyles() {
        document.documentElement.style.setProperty('--bg-color', '#f8fafc');
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#0f172a');
        document.documentElement.style.setProperty('--text-secondary', '#475569');
        document.documentElement.style.setProperty('--border-color', '#e2e8f0');
        document.documentElement.style.setProperty('--nav-bg', 'rgba(248, 250, 252, 0.9)');
    }

    function removeLightModeStyles() {
        document.documentElement.style.removeProperty('--bg-color');
        document.documentElement.style.removeProperty('--card-bg');
        document.documentElement.style.removeProperty('--text-primary');
        document.documentElement.style.removeProperty('--text-secondary');
        document.documentElement.style.removeProperty('--border-color');
        document.documentElement.style.removeProperty('--nav-bg');
    }

    // --- Scroll Animations ---
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.project-card, .timeline-item, .skill-category, .soft-card, .section-title');
    hiddenElements.forEach(el => {
        el.classList.add('hidden');
        observer.observe(el);
    });


    // --- Dynamic Projects Feature ---
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.getElementById('close-modal');
    const addForm = document.getElementById('add-form');
    const dynamicFields = document.getElementById('dynamic-fields');
    const modalTitle = document.querySelector('.modal-header h3');
    let currentSection = null;

    // Configuration for each section
    const sectionConfig = {
        education: {
            title: 'Add Education',
            storageKey: 'portfolio_education',
            containerId: 'education-timeline',
            fields: [
                { label: 'Degree', id: 'edu-degree', type: 'text', required: true },
                { label: 'School/College', id: 'edu-school', type: 'text', required: true },
                { label: 'Year', id: 'edu-year', type: 'text', required: true, placeholder: 'e.g. 2022 - 2026' },
                { label: 'Grade/CGPA', id: 'edu-grade', type: 'text', required: false }
            ],
            render: (item, container) => {
                const div = document.createElement('div');
                div.className = 'timeline-item';
                div.id = `item-${item.id}`; // Add ID for delete animation targeting
                div.innerHTML = `
                    ${isAdmin ? `<button class="delete-item-btn" onclick="deleteItem(${item.id}, 'portfolio_education', this);"><i class="fas fa-trash"></i></button>` : ''}
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">${item['edu-year']}</div>
                    <div class="timeline-content">
                        <h3>${item['edu-degree']}</h3>
                        <p>${item['edu-school']}</p>
                        ${item['edu-grade'] ? `<span class="grade">${item['edu-grade']}</span>` : ''}
                    </div>
                `;
                container.prepend(div);
            }
        },
        skills: {
            title: 'Add Skill',
            storageKey: 'portfolio_skills',
            containerId: 'skills-container',
            fields: [
                { label: 'Skill Name', id: 'skill-name', type: 'text', required: true },
                { label: 'Category', id: 'skill-cat', type: 'select', options: ['Programming', 'Web Technologies', 'Tools & Databases'], required: true }
            ],
            render: (item, container) => {
                const categories = container.querySelectorAll('.skill-category');
                let tagsContainer;
                categories.forEach(cat => {
                    if (cat.querySelector('h3').textContent.includes(item['skill-cat'])) {
                        tagsContainer = cat.querySelector('.skill-tags');
                    }
                });

                if (tagsContainer) {
                    const span = document.createElement('span');
                    span.className = 'skill-tag';
                    span.id = `item-${item.id}`;
                    span.innerHTML = `<i class="fas fa-check-circle"></i> ${item['skill-name']} ${isAdmin ? `<button class="delete-item-btn" onclick="deleteItem(${item.id}, 'portfolio_skills', this);"><i class="fas fa-trash"></i></button>` : ''}`;
                    tagsContainer.appendChild(span);
                }
            }
        },
        projects: {
            title: 'Add Project',
            storageKey: 'portfolio_projects',
            containerId: 'projects-grid',
            fields: [
                { label: 'Title', id: 'proj-title', type: 'text', required: true },
                { label: 'Description', id: 'proj-desc', type: 'textarea', required: true },
                { label: 'Tags (comma separated)', id: 'proj-tags', type: 'text', placeholder: 'Java, HTML, CSS' },
                { label: 'GitHub Link (Optional)', id: 'proj-link', type: 'text', placeholder: 'https://github.com/...' }
            ],
            render: (item, container) => {
                const link = item['proj-link'] || '#';
                const el = document.createElement('a');
                el.href = link;
                el.target = '_blank';
                el.className = 'project-card';
                el.id = `item-${item.id}`;
                el.style.textDecoration = 'none';
                el.style.color = 'inherit';
                el.style.display = 'block';
                el.style.position = 'relative'; // ensure relative for btn

                const tags = item['proj-tags'] ? item['proj-tags'].split(',').map(t => `<span>${t.trim()}</span>`).join('') : '';

                el.innerHTML = `
                    ${isAdmin ? `<button class="delete-item-btn" onclick="deleteItem(${item.id}, 'portfolio_projects', this); return false;"><i class="fas fa-trash"></i></button>` : ''}
                    <div class="project-icon"><i class="fas fa-code"></i></div>
                    <div class="project-info">
                        <h3>${item['proj-title']}</h3>
                        <p>${item['proj-desc']}</p>
                        <div class="tags">${tags}</div>
                    </div>
                `;
                container.appendChild(el);
            }
        },
        certifications: {
            title: 'Add Certification',
            storageKey: 'portfolio_certs',
            containerId: 'cert-list',
            fields: [
                { label: 'Certification Name', id: 'cert-name', type: 'text', required: true },
                { label: 'Drive/Image Link', id: 'cert-link', type: 'text', placeholder: 'https://...', required: true }
            ],
            render: (item, container) => {
                const li = document.createElement('li');
                li.id = `item-${item.id}`;
                li.style.position = 'relative';
                const link = item['cert-link'] || '#';
                li.innerHTML = `
                    ${isAdmin ? `<button class="delete-item-btn" onclick="deleteItem(${item.id}, 'portfolio_certs', this); return false;"><i class="fas fa-trash"></i></button>` : ''}
                    <a href="${link}" target="_blank" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 15px; width: 100%;"><i class="fas fa-certificate"></i> ${item['cert-name']}</a>
                `;
                container.appendChild(li);
            }
        }
    };

    Object.values(sectionConfig).forEach(config => {
        const saved = JSON.parse(localStorage.getItem(config.storageKey)) || [];
        const container = document.getElementById(config.containerId);
        if (container) {
            saved.forEach(item => config.render(item, container));
        }
    });

    document.querySelectorAll('.section-add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = btn.parentElement;
            let sectionType = '';

            if (section.classList.contains('education')) sectionType = 'education';
            else if (section.classList.contains('skills')) sectionType = 'skills';
            else if (section.classList.contains('projects')) sectionType = 'projects';
            else if (section.classList.contains('certifications')) sectionType = 'certifications';

            if (sectionType && sectionConfig[sectionType]) {
                openModal(sectionType);
            }
        });
    });

    function openModal(type) {
        currentSection = sectionConfig[type];
        modalTitle.textContent = currentSection.title;
        dynamicFields.innerHTML = '';

        currentSection.fields.forEach(field => {
            const group = document.createElement('div');
            group.className = 'form-group';

            const label = document.createElement('label');
            label.setAttribute('for', field.id);
            label.textContent = field.label;
            group.appendChild(label);

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = 3;
            } else if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    input.appendChild(option);
                });
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.id = field.id;
            if (field.required) input.required = true;
            if (field.placeholder) input.placeholder = field.placeholder;

            group.appendChild(input);
            dynamicFields.appendChild(group);
        });

        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal.addEventListener('click', closeAddModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeAddModal();
    });

    function closeAddModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        currentSection = null;
    }

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!currentSection) return;

        const newData = { id: Date.now() }; // Add unique ID
        currentSection.fields.forEach(field => {
            newData[field.id] = document.getElementById(field.id).value;
        });

        const saved = JSON.parse(localStorage.getItem(currentSection.storageKey)) || [];
        saved.push(newData);
        localStorage.setItem(currentSection.storageKey, JSON.stringify(saved));

        const container = document.getElementById(currentSection.containerId);
        currentSection.render(newData, container);

        addForm.reset();
        closeAddModal();
    });

    // Initialize Static Items (Core Code)
    function initStaticItems() {
        const deletedStatic = JSON.parse(localStorage.getItem('deleted_static_items')) || [];

        const setupItem = (item, prefix, index) => {
            const id = `${prefix}-${index}`;
            // Remove if previously deleted
            if (deletedStatic.includes(id)) {
                item.remove();
                return;
            }

            // Only add button if in admin mode and not already present (skips dynamic items)
            if (isAdmin && !item.querySelector('.delete-item-btn')) {
                const btn = document.createElement('button');
                btn.className = 'delete-item-btn';
                btn.innerHTML = '<i class="fas fa-trash"></i>';
                btn.setAttribute('onclick', `deleteItem('${id}', 'static', this); return false;`);

                item.appendChild(btn);
            }
        };

        const eduItems = document.querySelectorAll('#education-timeline .timeline-item');
        eduItems.forEach((el, i) => setupItem(el, 'static-edu', i));

        const skillItems = document.querySelectorAll('.skill-tag');
        skillItems.forEach((el, i) => setupItem(el, 'static-skill', i));

        const projectItems = document.querySelectorAll('.project-card');
        projectItems.forEach((el, i) => setupItem(el, 'static-proj', i));

        const certItems = document.querySelectorAll('#cert-list li');
        certItems.forEach((el, i) => setupItem(el, 'static-cert', i));
    }

    initStaticItems();

    // Global Delete Function
    window.deleteItem = function (id, storageKey, btn) {
        if (event) event.preventDefault();
        if (event) event.stopPropagation();

        if (confirm('Are you sure you want to delete this item?')) {
            if (storageKey === 'static') {
                const deleted = JSON.parse(localStorage.getItem('deleted_static_items')) || [];
                deleted.push(id);
                localStorage.setItem('deleted_static_items', JSON.stringify(deleted));
            } else {
                const saved = JSON.parse(localStorage.getItem(storageKey)) || [];
                const updated = saved.filter(item => item.id != id);
                localStorage.setItem(storageKey, JSON.stringify(updated));
            }

            let elementToRemove;
            if (btn.closest('.timeline-item')) elementToRemove = btn.closest('.timeline-item');
            else if (btn.closest('.project-card')) elementToRemove = btn.closest('.project-card');
            else if (btn.closest('.skill-tag')) elementToRemove = btn.closest('.skill-tag');
            else if (btn.closest('li')) elementToRemove = btn.closest('li');

            if (elementToRemove) {
                elementToRemove.style.opacity = '0';
                elementToRemove.style.transform = 'scale(0.9)';
                setTimeout(() => elementToRemove.remove(), 300);
            }
        }
    };
});
