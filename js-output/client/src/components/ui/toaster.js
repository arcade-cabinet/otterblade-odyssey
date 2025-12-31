import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
export function Toaster() {
    const { toasts } = useToast();
    return (React.createElement(ToastProvider, null,
        toasts.map(({ id, title, description, action, ...props }) => (React.createElement(Toast, { key: id, ...props },
            React.createElement("div", { className: "grid gap-1" },
                title && React.createElement(ToastTitle, null, title),
                description && React.createElement(ToastDescription, null, description)),
            action,
            React.createElement(ToastClose, null)))),
        React.createElement(ToastViewport, null)));
}
