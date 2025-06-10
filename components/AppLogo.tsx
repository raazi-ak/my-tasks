import React from 'react';
import Svg, { 
  Defs, 
  LinearGradient, 
  Stop, 
  Filter, 
  FeGaussianBlur, 
  FeOffset, 
  FeFlood, 
  FeComposite, 
  FeMerge, 
  FeMergeNode, 
  Rect, 
  Path 
} from 'react-native-svg';

interface AppLogoProps {
  size?: number;
  style?: any;
}

export default function AppLogo({ size = 100, style }: AppLogoProps) {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      style={style}
    >
      <Defs>
        {/* Background gradient */}
        <LinearGradient id="modernBlueBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#3A7BD5" />
          <Stop offset="100%" stopColor="#0062E6" />
        </LinearGradient>

        {/* Paper gradient */}
        <LinearGradient id="paperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E0E0E0" />
          <Stop offset="100%" stopColor="#F5F5F5" />
        </LinearGradient>

        {/* Checkmark gradient */}
        <LinearGradient id="checkmarkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4CAF50" />
          <Stop offset="100%" stopColor="#8BC34A" />
        </LinearGradient>

        {/* Soft shadow filter */}
        <Filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur in="SourceAlpha" stdDeviation="8"/>
          <FeOffset dx="4" dy="6" result="shadow"/>
          <FeFlood floodColor="#000" floodOpacity="0.2"/>
          <FeComposite in2="shadow" operator="in"/>
          <FeMerge>
            <FeMergeNode/>
            <FeMergeNode in="SourceGraphic"/>
          </FeMerge>
        </Filter>
      </Defs>

      {/* Main background shape */}
      <Rect 
        x="0" 
        y="0" 
        width="200" 
        height="200" 
        rx="40" 
        ry="40" 
        fill="url(#modernBlueBg)" 
      />

      {/* Paper element */}
      <Rect 
        x="45" 
        y="45" 
        width="110" 
        height="110" 
        rx="15" 
        ry="15" 
        fill="url(#paperGradient)" 
        transform="rotate(-5 100 100)"
      />

      {/* Task lines */}
      <Rect x="55" y="70" width="80" height="6" rx="2" ry="2" fill="#757575" transform="rotate(-5 100 100)"/>
      <Rect x="55" y="85" width="70" height="6" rx="2" ry="2" fill="#757575" transform="rotate(-5 100 100)"/>
      <Rect x="55" y="100" width="85" height="6" rx="2" ry="2" fill="#757575" transform="rotate(-5 100 100)"/>

      {/* Checkmark */}
      <Path 
        d="M70 120 L95 145 L145 100" 
        stroke="url(#checkmarkGradient)" 
        strokeWidth="12" 
        fill="none" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        transform="rotate(-5 100 100)"
      />
    </Svg>
  );
} 