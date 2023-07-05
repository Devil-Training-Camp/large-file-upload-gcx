const ProgressBar = (props) => {
  const { max, value, label } = props;

  return (
    <div>
      <label>{label}</label>
      <progress value={value} max={max} />
    </div>
  );
};
export default ProgressBar;
