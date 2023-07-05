const PauseBtn = (props) => {
  const { controllerRef } = props;
  const handleClick = () => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
  };
  return <button onClick={handleClick}>暂停</button>;
};

export default PauseBtn;
