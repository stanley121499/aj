import type { CustomFlowbiteTheme } from "flowbite-react";

const flowbiteTheme: CustomFlowbiteTheme = {
  badge: {
    root: {
      color: {
        info: "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-300",
        primary:
          "bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-800 group-hover:bg-blue-200 dark:group-hover:bg-blue-300",
      },
      size: {
        xl: "px-3 py-2 text-base rounded-md",
      },
    },
    icon: {
      off: "rounded-full px-2 py-1",
    },
  },
  button: {
    color: {
      gray: "text-gray-900 bg-white border border-gray-200 enabled:hover:bg-gray-100 enabled:hover:text-blue-700 :ring-blue-700 focus:text-blue-700 dark:bg-transparent dark:text-gray-400 dark:border-gray-600 dark:enabled:hover:text-white dark:enabled:hover:bg-gray-700 focus:ring-2",
      info: "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
      primary:
        "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
    },
    inner: {
      base: "flex items-center transition-all duration-200",
    },
    outline: {
      color: {
        gray: "border border-gray-200 dark:border-gray-500",
      },
    },
  },
  dropdown: {
    floating: {
      base: "z-10 w-fit rounded-xl divide-y divide-gray-100 shadow",
      content: "rounded-xl text-sm text-gray-700 dark:text-gray-200",
      target: "w-fit dark:text-white",
    },
    content: "",
  },
  // Restore viewport-bounded modals (custom theme had removed max-h / flex-col).
  modal: {
    root: {
      base: "fixed inset-0 z-50 h-modal h-screen overflow-y-auto overflow-x-hidden md:h-full",
      positions: {
        center: "items-start justify-center sm:items-center",
      },
    },
    content: {
      base: "relative h-full w-full p-4 md:h-auto",
      inner:
        "relative flex max-h-[90vh] min-h-0 flex-col overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800",
    },
    body: {
      base: "min-h-0 flex-1 overflow-y-auto p-6",
    },
    header: {
      base: "sticky top-0 z-10 flex shrink-0 items-start justify-between rounded-t border-b border-gray-200 bg-white px-5 pt-5 dark:border-gray-600 dark:bg-gray-800",
    },
    footer: {
      base: "sticky bottom-0 z-10 flex shrink-0 items-center space-x-2 rounded-b border-t border-gray-200 bg-white p-6 dark:border-gray-600 dark:bg-gray-800",
    },
  },
  navbar: {
    root: {
      base: "fixed z-30 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700",
    },
  },
  sidebar: {
    root: {
      base: "flex fixed top-0 left-0 z-20 flex-col flex-shrink-0 pt-16 h-full duration-75 border-r border-gray-200 lg:flex transition-width dark:border-gray-700",
    },
    item: {
      base: "flex items-center justify-center rounded-lg p-2 text-base font-medium text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
    },
    collapse: {
      button:
        "group flex w-full items-center rounded-lg p-2 text-base font-medium text-gray-900 transition duration-75 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
    },
  },
  textarea: {
    base: "block w-full text-sm p-4 rounded-lg border disabled:cursor-not-allowed disabled:opacity-50",
  },
  textInput: {
    field: {
      input: {
        colors: {
          info: "border-blue-500 bg-blue-50 text-blue-900 placeholder-blue-700 focus:border-blue-500 focus:ring-blue-500 dark:border-blue-400 dark:bg-blue-100 dark:focus:border-blue-500 dark:focus:ring-blue-500",
        },
        withIcon: {
          on: "!pl-12",
        },
      },
    },
  },
  toggleSwitch: {
    toggle: {
      checked: {
        color: {
          blue: "bg-blue-700 border-blue-700",
        },
      },
    },
  },
};

export default flowbiteTheme;
