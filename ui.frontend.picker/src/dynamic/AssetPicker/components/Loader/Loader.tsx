import { FC } from "react";

import { useTranslation } from "../../contexts/I18n.context";

import styles from "./Loader.module.scss";

export const Loader: FC = () => {
  const { __ } = useTranslation();
  return <span className={styles.loader} aria-label={__("directoryExplorer.loading")}></span>;
};
