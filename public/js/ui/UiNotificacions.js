/**
 * Gestió de notificacions toast.
 */

export class UiNotificacions {
    /**
     * Mostra una notificació toast.
     * @param {string} missatge - Text del missatge.
     * @param {'success'|'error'|'warning'|'info'} tipus - Tipus de notificació.
     */
    static mostrar(missatge, tipus = 'success') {
        const element = document.getElementById('notificationToast');
        if (!element) return;

        const cos = element.querySelector('.toast-body');

        element.className = 'toast align-items-center border-0';
        const classes = {
            success: ['bg-success', 'text-white'],
            error: ['bg-danger', 'text-white'],
            warning: ['bg-warning', 'text-dark'],
            info: ['bg-info', 'text-white'],
        };
        element.classList.add(...(classes[tipus] || classes.success));

        cos.textContent = missatge;

        const toast = new bootstrap.Toast(element, { autohide: true, delay: 3000 });
        toast.show();
    }
}
