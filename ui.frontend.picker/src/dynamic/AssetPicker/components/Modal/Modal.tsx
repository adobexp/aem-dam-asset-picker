import { FC, PropsWithChildren, useEffect, useRef, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

import classNames from "classnames";

import styles from "./Modal.module.scss";

type ModalProps = {
  className?: string;
  isOpen: boolean;
  hasCloseButton?: boolean;
  onClose: () => void;
};

export const Modal: FC<PropsWithChildren<ModalProps>> = ({
  className = "",
  isOpen,
  hasCloseButton = true,
  onClose,
  children,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const modalRef = useRef<HTMLDialogElement>(null);

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    }
    setIsModalOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "Escape") {
      handleCloseModal();
    }
  };

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    const modalElement = modalRef.current;

    if (!modalElement) {
      return;
    }
    if (isModalOpen) {
      modalElement.showModal();
    } else {
      modalElement.close();
    }
  }, [isModalOpen]);

  return (
    <dialog ref={modalRef} onKeyDown={handleKeyDown} className={classNames(styles.modal, className)}>
      {hasCloseButton && (
        <button className={styles.closeButton} onClick={handleCloseModal} type="button">
          <AiOutlineClose />
        </button>
      )}
      {children}
    </dialog>
  );
};
