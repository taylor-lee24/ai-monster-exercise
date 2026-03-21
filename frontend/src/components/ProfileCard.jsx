import { useRef, useState } from 'react';
import { CheckCircle, AlertCircle, User, Building2, Briefcase, FileText, Factory, TrendingUp, UserCircle, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import AvatarEditor from './AvatarEditor';

export default function ProfileCard({ user }) {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [editorSrc, setEditorSrc] = useState(null);

  if (!user) return null;

  const handleAvatarClick = () => {
    if (user.avatar) {
      setEditorSrc(user.avatar);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setEditorSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEditorSave = async (base64) => {
    setEditorSrc(null);
    setUploading(true);
    try {
      await userAPI.updateProfile({ avatar: base64 });
      await refreshUser();
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadNew = () => {
    setEditorSrc(null);
    fileInputRef.current?.click();
  };

  const handleDeleteAvatar = async () => {
    setEditorSrc(null);
    setUploading(true);
    try {
      await userAPI.updateProfile({ avatar: null });
      await refreshUser();
      toast.success('Avatar removed!');
    } catch {
      toast.error('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Name', icon: User, value: user.name },
    { key: 'email', label: 'Email', icon: null, value: user.email },
    { key: 'company', label: 'Company', icon: Building2, value: user.company },
    { key: 'role', label: 'Role', icon: Briefcase, value: user.role },
    { key: 'pronouns', label: 'Pronouns', icon: UserCircle, value: user.pronouns },
    { key: 'bio', label: 'Bio', icon: FileText, value: user.bio },
    { key: 'industry', label: 'Industry', icon: Factory, value: user.industry },
    { key: 'experience_level', label: 'Experience', icon: TrendingUp, value: user.experience_level },
  ];

  const filledCount = fields.filter((f) => f.value).length;
  const percentage = Math.round((filledCount / fields.length) * 100);
  const initial = user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase();

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <button type="button" className={`avatar avatar-editable${uploading ? ' uploading' : ''}${user.avatar ? ' has-image' : ''}`} onClick={handleAvatarClick}>
          {user.avatar ? (
            <img src={user.avatar} alt="Avatar" className="avatar-img" />
          ) : (
            initial
          )}
          <span className="avatar-edit-badge">
            <Pencil size={12} />
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            hidden
          />
        </button>
        <div>
          <h3>{user.name || 'Complete your profile'}</h3>
          <p className="profile-email">{user.email}</p>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span>Profile completion</span>
          <span className="progress-percent">{percentage}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="profile-fields">
        {fields.map((field) => (
          <div key={field.key} className={`profile-field ${field.value ? 'filled' : 'empty'}`}>
            {field.value ? (
              <CheckCircle size={16} className="field-status filled" />
            ) : (
              <AlertCircle size={16} className="field-status empty" />
            )}
            <span className="field-label">{field.label}</span>
            <span className="field-value">{field.value || 'Not provided'}</span>
          </div>
        ))}
      </div>

      {editorSrc && (
        <AvatarEditor
          imageSrc={editorSrc}
          onSave={handleEditorSave}
          onCancel={() => setEditorSrc(null)}
          onUploadNew={handleUploadNew}
          onDelete={user.avatar ? handleDeleteAvatar : undefined}
        />
      )}
    </div>
  );
}
