import { useId } from 'react';
import { getTechnologyIcon } from '../lib/skill-icons';
import jqueryMobile from '../assets/skill-icons/jquery-mobile.png?inline';
import gwt from '../assets/skill-icons/gwt.png?inline';
import parcel from '../assets/skill-icons/parcel.png?inline';
import docusign from '../assets/skill-icons/docusign.png?inline';
import vscode from '../assets/skill-icons/vscode.svg?inline';

const images = { parcel, docusign, vscode, gwt, jqueryMobile };
export default function SkillIcon({ skill }: { skill: string }) {
  const maskId = useId();
  const icon = getTechnologyIcon(skill);
  if (!icon) return null;
  return <svg className="skill-icon skill-icon--brand" data-icon-kind="brand" data-icon-name={icon.id} viewBox={icon.viewBox} aria-hidden="true" focusable="false">
    {icon.image ? <>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24" style={{ maskType: 'alpha' }}>
          <image href={images[icon.image]} width="24" height="24" preserveAspectRatio="xMidYMid meet" />
        </mask>
      </defs>
      <rect width="24" height="24" mask={`url(#${maskId})`} />
    </> : <path d={icon.path} />}
  </svg>;
}
