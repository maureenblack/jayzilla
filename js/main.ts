/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

// Types
interface ContactForm {
    name: string;
    email: string;
    message: string;
}

interface ServiceRequest {
    service: string;
    date: Date;
    location: string;
    description: string;
}

// Form Handling
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm') as HTMLFormElement;
    
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach((anchor: Element) => {
        anchor.addEventListener('click', function(this: HTMLAnchorElement, e: Event) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href') || '');
            target?.scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Initialize animations
    initializeAnimations();

    // Initialize back to top button
    initializeBackToTop();
});

// Contact Form Handler
function handleContactSubmit(event: Event): void {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const contactData: ContactForm = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        message: formData.get('message') as string
    };

    // Here you would typically send the data to a server
    console.log('Form submitted:', contactData);
    
    // Show success message
    showNotification('Message sent successfully!', 'success');
    form.reset();
}

// Notification Helper
function showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notification.textContent = message;
    notification.style.zIndex = '1000';
    
    document.body.appendChild(notification);
    
    // Animate notification
    notification.style.animation = 'slideIn 0.5s ease-out';
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-in';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Initialize Back to Top Button
function initializeBackToTop(): void {
    const backToTopButton = document.querySelector('.back-to-top') as HTMLElement;
    
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Service Request Handler
function requestService(service: string): void {
    // This would typically open a modal or navigate to a booking page
    console.log(`Requesting service: ${service}`);
    showNotification('Service request initiated', 'success');
}

// Image Upload Handler
function handleImageUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    
    if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview') as HTMLImageElement;
            if (preview && e.target?.result) {
                preview.src = e.target.result as string;
                preview.style.animation = 'fadeIn 0.5s ease-out';
            }
        };
        
        reader.readAsDataURL(file);
    }
}

// Initialize any third-party components or additional features
function initializeAnimations(): void {
    // Add any initialization code here
    console.log('Animations initialized');
}

// Initialize any third-party components or additional features
function initializeComponents(): void {
    // Add any initialization code here
    console.log('Components initialized');
}
