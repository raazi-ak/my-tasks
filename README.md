# My Tasks

A beautiful and intuitive task management app built with React Native and Expo, featuring modern UI design and powerful productivity tools.

## 🚀 Features

- **Modern UI/UX** - SwiftUI-inspired design with smooth animations
- **Dark/Light Mode** - Full theme support with system sync
- **Task Management** - Create, edit, delete, and organize tasks
- **Smart Categories** - Organize tasks by Work, Personal, Health, Learning, Shopping
- **Priority System** - Set high, medium, or low priority levels
- **Due Dates & Times** - Native date/time pickers with system format detection
- **Advanced Gestures** - Swipe-to-delete/edit with haptic feedback
- **Analytics Dashboard** - Track productivity with detailed insights
- **Undo System** - 5-second undo for accidental deletions
- **Cross-Platform** - Runs on iOS, Android, and Web

## 🛠️ Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Navigation:** Expo Router
- **State Management:** Zustand with AsyncStorage persistence
- **UI Components:** Custom components with Lucide React Native icons
- **Styling:** Dynamic theming system
- **Platform Features:** Native date/time pickers, haptic feedback

## 📱 Screenshots

*Add screenshots here*

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js (16+)
- pnpm (recommended) or npm
- Expo CLI
- iOS Simulator / Android Emulator / Physical device

### Installation

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/my-tasks.git
cd my-tasks
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open the app:
   - iOS: Press `i` in terminal or scan QR code with Camera app
   - Android: Press `a` in terminal or scan QR code with Expo Go app
   - Web: Press `w` in terminal

## 🏗️ Build for Production

### Web
```bash
pnpm build:web
```

### Mobile
```bash
# Android
pnpm build:android

# iOS
pnpm build:ios
```

## 📁 Project Structure

```
my-tasks/
├── app/                    # App screens and layouts
│   ├── (tabs)/            # Tab-based screens
│   │   ├── index.tsx      # Tasks screen
│   │   ├── analytics.tsx  # Analytics screen
│   │   └── profile.tsx    # Settings screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ModernHeader.tsx   # Header component
│   ├── TaskCard.tsx       # Task item component
│   ├── AddTaskModal.tsx   # Add task modal
│   ├── EditTaskModal.tsx  # Edit task modal
│   └── UndoBanner.tsx     # Undo functionality
├── stores/                # State management
│   ├── taskStore.ts       # Task data store
│   └── themeStore.ts      # Theme management
├── types/                 # TypeScript definitions
│   └── task.ts           # Task interfaces
└── assets/               # Images and fonts
```

## 🎨 Key Features Explained

### Smart Task Management
- Create tasks with titles, descriptions, categories, and priorities
- Set due dates and times with native pickers
- Add reminders (1 hour before due time)
- Estimate task duration with +/- controls

### Advanced Interactions
- **Normal Swipe**: Reveal edit/delete actions
- **Overscroll Swipe**: Immediate action execution with eclipse animation
- **Long Press**: Context menu with haptic feedback
- **Undo System**: 5-second recovery window for deletions

### Productivity Analytics
- **Completion Rate**: Track task completion percentage
- **Productivity Score**: Weighted algorithm based on completion, efficiency, and consistency
- **Time Tracking**: Monitor estimated vs completed time
- **Period Filtering**: View stats by week, month, or year

### Theme System
- **Dynamic Theming**: Complete dark/light mode support
- **System Sync**: Automatically follow system appearance
- **Material You**: Android 12+ dynamic colors (Android only)
- **Consistent UI**: All system dialogs and pickers follow app theme

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_NO_TELEMETRY=1
```

### Theme Customization
Modify theme colors in `stores/themeStore.ts`:
```typescript
const lightTheme = {
  colors: {
    primary: '#2563EB',
    // ... other colors
  }
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Raazi Faisal**
- GitHub: [@raaziak](https://github.com/raaziak)

## 🙏 Acknowledgments

- Expo team for the amazing framework
- Lucide for beautiful icons
- React Native community for continuous improvements

---

*Built with �� by Raazi Faisal* 