/* eslint-disable jsx-a11y/anchor-is-valid */
import {
  Button,
  Label,
  Modal,
  Select,
  TextInput,
  Datepicker,
} from "flowbite-react";
import React, { useState } from "react";
import { FaUsersCog } from "react-icons/fa";
import { FaPhoneFlip } from "react-icons/fa6";
import { HiMail, HiPlus } from "react-icons/hi";
import { LiaBirthdayCakeSolid } from "react-icons/lia";
import { PiPasswordBold } from "react-icons/pi";
import { User, useUserContext } from "../../context/UserContext";
import { buildFruitCalculatorEmail } from "../../utils/createUserAccount";
import { useAlertContext } from "../../context/AlertContext";

const AddUserModal: React.FC = function () {
  const [isOpen, setOpen] = useState(false);
  const { addUser } = useUserContext();
  const { showAlert } = useAlertContext();
  const [userData, setUserData] = useState({
    email: "",
    password: "",
    user_detail: {
      birthday: "",
      role: "customer",
      contact_number: "",
    },
  });

  /**
   * Builds Auth email from username (sanitized local-part) and creates the user.
   */
  const handleAddUser = async () => {
    let accountEmail: string;
    try {
      accountEmail = buildFruitCalculatorEmail(userData.email);
    } catch (error) {
      showAlert(
        error instanceof Error ? error.message : "Invalid username",
        "error"
      );
      return;
    }

    const nextUserData = {
      ...userData,
      email: accountEmail,
      user_detail: { ...userData.user_detail },
    };

    // Remove empty fields in user_detail
    (
      Object.keys(nextUserData.user_detail) as Array<
        keyof typeof nextUserData.user_detail
      >
    ).forEach((key) => {
      if (nextUserData.user_detail[key] === "") {
        delete nextUserData.user_detail[key];
      }
    });
    console.log(nextUserData);

    try {
      await addUser(nextUserData as User);
      setOpen(false);
    } catch {
      // addUser already surfaces the error via AlertContext
    }
  };

  return (
    <>
      <Button color="primary" onClick={() => setOpen(true)}>
        <div className="flex items-center gap-x-3">
          <HiPlus className="text-xl" />
          Add User
        </div>
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
          <strong>Add new user</strong>
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1">
            <div>
              <Label htmlFor="username">Username</Label>
              <div className="mt-1">
                <TextInput
                  id="username"
                  name="username"
                  placeholder="Bonnie"
                  icon={HiMail}
                  value={userData.email}
                  onChange={(e) =>
                    setUserData({ ...userData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Password</Label>
              <div className="mt-1">
                <TextInput
                  id="password"
                  name="password"
                  placeholder="********"
                  icon={PiPasswordBold}
                  type="password"
                  value={userData.password}
                  onChange={(e) =>
                    setUserData({ ...userData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birthday">Birthday</Label>
              <div className="mt-1">
                {/* Date input should show and save in the format of DD-MM-YYYY */}
                <Datepicker
                  id="birthday"
                  name="birthday"
                  icon={LiaBirthdayCakeSolid}
                  value={userData.user_detail.birthday}
                  onSelectedDateChanged={(date) =>
                    setUserData({
                      ...userData,
                      user_detail: {
                        ...userData.user_detail,
                        birthday: (date as Date).toLocaleDateString(),
                      },
                    } as typeof userData)
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contact_number">Contact Number</Label>
              <div className="mt-1">
                <TextInput
                  id="contact_number"
                  name="contact_number"
                  placeholder="09123456789"
                  icon={FaPhoneFlip}
                  value={userData.user_detail.contact_number}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      user_detail: {
                        ...userData.user_detail,
                        contact_number: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <div className="mt-1">
                <Select
                  id="role"
                  name="role"
                  icon={FaUsersCog}
                  value={userData.user_detail.role}
                  onChange={(e) =>
                    setUserData({
                      ...userData,
                      user_detail: {
                        ...userData.user_detail,
                        role: e.target.value,
                      },
                    })
                  }>
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="primary" onClick={handleAddUser}>
            Add user
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AddUserModal;
