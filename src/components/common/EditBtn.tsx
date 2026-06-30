import shared from '@commons/shared.module.css';

type EditBtnProps = {
  onClick?: () => void;
};

export default function EditBtn({ onClick }: EditBtnProps) {
  return (
    <button type="button" className={shared.btnEdit} onClick={onClick} title="수정">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    </button>
  );
}
