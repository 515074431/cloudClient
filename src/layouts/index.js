import styles from './index.css';

function BasicLayout(props) {
  if (props.location.pathname === '/userlogin') {
    return <div>{ props.children }</div>
  }
  return (
    <div className={styles.normal}>
      <h1 className={styles.title}>Yay! Welcome to umi!</h1>
      {props.children}
    </div>
  );
}

export default BasicLayout;
