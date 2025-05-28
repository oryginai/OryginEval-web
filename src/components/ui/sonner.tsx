import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-xl",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-red-600 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
          success: "group-[.toaster]:bg-green-900 group-[.toaster]:border-green-700",
          error: "group-[.toaster]:bg-red-900 group-[.toaster]:border-red-700",
          warning: "group-[.toaster]:bg-yellow-900 group-[.toaster]:border-yellow-700",
          info: "group-[.toaster]:bg-blue-900 group-[.toaster]:border-blue-700",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
