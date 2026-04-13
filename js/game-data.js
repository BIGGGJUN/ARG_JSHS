(() => {
  const ASSETS = {
    branding: {
      logo: 'assets/branding/logo-placeholder.png',
      logoAlt: 'Minecraft-style ARG logo placeholder'
    },
    ui: {
      window: 'assets/ui/window.png',
      frameTaskComplete: 'assets/ui/task_complete.png',
      frameTaskOpen: 'assets/ui/task_open.png',
      frameGoalComplete: 'assets/ui/goal_complete.png',
      frameGoalOpen: 'assets/ui/goal_open.png',
      frameChallengeComplete: 'assets/ui/challenge_complete.png',
      frameChallengeOpen: 'assets/ui/challenge_open.png',
      buttonGold: 'assets/ui/button_gold.png',
      buttonBlue: 'assets/ui/button_blue.png',
      buttonDark: 'assets/ui/button_dark.png'
    },
    backgrounds: {
      lobby: 'assets/backgrounds/panorama_lobby.png',
      story: 'assets/backgrounds/panorama_story.png',
      nether: 'assets/backgrounds/panorama_nether.png',
      life: 'assets/backgrounds/panorama_life.png',
      finale: 'assets/backgrounds/panorama_finale.png'
    },
    panelTiles: {
      stone: 'assets/backgrounds/stone.png',
      adventure: 'assets/backgrounds/adventure.png',
      nether: 'assets/backgrounds/nether.png',
      husbandry: 'assets/backgrounds/husbandry.png',
      end: 'assets/backgrounds/end.png'
    },
    icons: {
      book: 'assets/icons/book.png',
      blazeRod: 'assets/icons/blaze_rod.png',
      bell: 'assets/icons/bell.png',
      clock: 'assets/icons/clock_00.png',
      bone: 'assets/icons/bone.png',
      cake: 'assets/icons/cake.png',
      campfire: 'assets/icons/campfire.png',
      carrot: 'assets/icons/carrot.png',
      cauldron: 'assets/icons/cauldron.png',
      chicken: 'assets/icons/chicken.png',
      chorusFruit: 'assets/icons/chorus_fruit.png',
      beacon: 'assets/icons/beacon.png',
      bedrock: 'assets/icons/bedrock.png',
      bookshelf: 'assets/icons/bookshelf.png'
    }
  };

  const AUDIO = {
    defaultEnabled: true,
    bgmVolume: 0.16,
    effectsVolume: 0.42,
    sounds: {
      click: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.8.4/assets/minecraft/sounds/random/click.ogg',
        fallback: 'assets/audio/fallback/click.wav',
        volume: 0.55
      },
      hover: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.8.4/assets/minecraft/sounds/random/wood_click.ogg',
        fallback: 'assets/audio/fallback/hover.wav',
        volume: 0.18
      },
      wrong: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.8.4/assets/minecraft/sounds/random/fizz.ogg',
        fallback: 'assets/audio/fallback/wrong.wav',
        volume: 0.48
      },
      success: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.8.4/assets/minecraft/sounds/random/levelup.ogg',
        fallback: 'assets/audio/fallback/correct.wav',
        volume: 0.52
      },
      unlock: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.8.4/assets/minecraft/sounds/random/orb.ogg',
        fallback: 'assets/audio/fallback/unlock.wav',
        volume: 0.42
      },
      toast: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.17-pre1/assets/minecraft/sounds/ui/toast/challenge_complete.ogg',
        fallback: 'assets/audio/fallback/toast.wav',
        volume: 0.36
      },
      bgm: {
        remote: 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.10.1/assets/minecraft/sounds/music/game/calm1.ogg',
        fallback: 'assets/audio/fallback/bgm_loop.wav',
        volume: 0.14
      }
    }
  };

  const SITE_CONFIG = {
    storageKey: 'mc-adv-arg.redesign.v2',
    siteTitle: 'Minecraft Advancement ARG',
    branding: ASSETS.branding,
    assets: ASSETS,
    audio: AUDIO,
    ui: {
      hintUnlockAttempts: [3, 7, 12],
      toastDurationMs: 4200,
      lobbyIntro: '닫힌 틀을 열면 현재 해금된 슬롯만 트리 형태로 표시됩니다. 숨겨진 문제는 해금 전까지 보이지 않습니다.',
      lobbyRule: '카테고리는 순차적으로 열리고, 각 카테고리 안의 문제는 선행 문제를 해결해야 다음 슬롯이 나타납니다.',
      hintRule: '힌트는 오답 3 / 7 / 12회에서 각각 열리지만, 직접 눌러야 볼 수 있습니다.',
      treeClosedText: '닫힌 틀을 열면 현재 해금된 슬롯만 트리로 표시됩니다.',
      treeOpenText: '트리에는 해금된 슬롯만 표시됩니다. 잠긴 문제는 계속 숨겨집니다.',
      treeDoorTitle: 'SEALED FRAME',
      treeDoorBody: '열어서 현재 진행 가능한 업적 트리를 확인하세요.'
    },
    utilityButtons: [
      {
        id: 'guide',
        label: 'GUIDE',
        icon: ASSETS.icons.book,
        href: 'README.md'
      },
      {
        id: 'audio',
        label: 'SOUND',
        icon: ASSETS.icons.bell
      },
      {
        id: 'reset',
        label: 'RESET',
        icon: ASSETS.icons.bedrock
      }
    ],
    categories: [
      {
        id: 'story',
        title: '채집의 시작',
        shortLabel: 'START',
        subtitle: '가장 먼저 손에 넣는 것들로 시작하는 튜토리얼 라인',
        icon: ASSETS.icons.book,
        panelTile: ASSETS.panelTiles.adventure,
        background: ASSETS.backgrounds.story,
        accent: '#7ecf6c',
        accentSoft: 'rgba(126, 207, 108, 0.24)',
        unlockAfterCategoryId: null,
        questions: [
          {
            id: 'story-1',
            title: '균형 잡힌 식사',
            shortTitle: 'MEAL',
            description: '오늘·내일 메뉴 규칙으로 내일의 추가 메뉴를 맞히는 문제.',
            file: 'pages/story/q1.html',
            icon: ASSETS.icons.cake,
            frameType: 'task',
            acceptedAnswers: ['APPLE'],
            prerequisiteIds: [],
            hints: [
              '각 식재료의 중심이 되는 메뉴가 추가 메뉴입니다.',
              '은어 Sweet Fish · 오징어 Squid · 소라 Turban Shell · 상어 Shark · 추가 메뉴: 참치(Tuna)',
              '구아바 Guava · 케이퍼 Caper · 콩포트 Compote · 멜론 Melon · 빵 Bread'
            ]
          },
          {
            id: 'story-2',
            title: '손안의 해와 달',
            shortTitle: 'CLOCK',
            description: '시간의 흐름을 보여주는 아이템을 묻는 두 번째 예시 문제.',
            file: 'pages/story/q2.html',
            icon: ASSETS.icons.clock,
            frameType: 'goal',
            acceptedAnswers: ['CLOCK'],
            prerequisiteIds: ['story-1'],
            hints: [
              '하루의 흐름을 손안에서 확인하는 아이템입니다.',
              '원형 바늘이 돌아가는 아이템입니다.',
              '정답은 영어 5글자, CLOCK 입니다.'
            ]
          }
        ]
      },
      {
        id: 'nether',
        title: '불과 연금술',
        shortLabel: 'NETHER',
        subtitle: '블레이즈와 네더 재료로 이어지는 두 번째 라인',
        icon: ASSETS.icons.blazeRod,
        panelTile: ASSETS.panelTiles.nether,
        background: ASSETS.backgrounds.nether,
        accent: '#ff8a66',
        accentSoft: 'rgba(255, 138, 102, 0.24)',
        unlockAfterCategoryId: 'story',
        questions: [
          {
            id: 'nether-1',
            title: '불꽃 몹의 막대',
            shortTitle: 'BLAZE ROD',
            description: '네더 요새의 대표 전리품을 맞히는 예시 문제.',
            file: 'pages/nether/q1.html',
            icon: ASSETS.icons.blazeRod,
            frameType: 'task',
            acceptedAnswers: ['BLAZE ROD'],
            prerequisiteIds: [],
            hints: [
              '네더 요새에서 만나는 몹이 떨어뜨립니다.',
              '엔더의 눈과 포션 재료로 이어지는 재료입니다.',
              '정답은 영어 2단어, BLAZE ROD 입니다.'
            ]
          },
          {
            id: 'nether-2',
            title: '막대가 가루가 되면',
            shortTitle: 'BLAZE POWDER',
            description: '막대를 가공했을 때 얻는 연금술 재료를 묻는 예시 문제.',
            file: 'pages/nether/q2.html',
            icon: ASSETS.icons.campfire,
            frameType: 'challenge',
            acceptedAnswers: ['BLAZE POWDER'],
            prerequisiteIds: ['nether-1'],
            hints: [
              '막대를 그대로 쓰지 않고 분쇄한 형태입니다.',
              '포션 양조와 엔드 진입에 쓰이는 가루입니다.',
              '정답은 영어 2단어, BLAZE POWDER 입니다.'
            ]
          }
        ]
      },
      {
        id: 'life',
        title: '생활과 탐험',
        shortLabel: 'LIFE',
        subtitle: '마을과 캠프처럼 생활권에서 만나는 요소들',
        icon: ASSETS.icons.bell,
        panelTile: ASSETS.panelTiles.husbandry,
        background: ASSETS.backgrounds.life,
        accent: '#f1cf6b',
        accentSoft: 'rgba(241, 207, 107, 0.24)',
        unlockAfterCategoryId: 'nether',
        questions: [
          {
            id: 'life-1',
            title: '마을 중앙의 울림',
            shortTitle: 'BELL',
            description: '생활형 아이템을 답으로 쓰는 예시 문제.',
            file: 'pages/life/q1.html',
            icon: ASSETS.icons.bell,
            frameType: 'task',
            acceptedAnswers: ['BELL'],
            prerequisiteIds: [],
            hints: [
              '약탈이 시작되면 자주 울립니다.',
              '마을 한가운데 걸려 있는 경우가 많습니다.',
              '정답은 영어 4글자, BELL 입니다.'
            ]
          },
          {
            id: 'life-2',
            title: '모닥불 위의 저녁',
            shortTitle: 'CAMPFIRE',
            description: '요리와 연출에 자주 쓰이는 불 블록 예시 문제.',
            file: 'pages/life/q2.html',
            icon: ASSETS.icons.campfire,
            frameType: 'goal',
            acceptedAnswers: ['CAMPFIRE'],
            prerequisiteIds: ['life-1'],
            hints: [
              '바닥에 설치해 연기와 불꽃을 냅니다.',
              '고기를 구울 수 있는 불입니다.',
              '정답은 영어 8글자, CAMPFIRE 입니다.'
            ]
          }
        ]
      },
      {
        id: 'finale',
        title: '최종 업적',
        shortLabel: 'FINAL',
        subtitle: '비콘과 베드락으로 이어지는 마지막 라인',
        icon: ASSETS.icons.beacon,
        panelTile: ASSETS.panelTiles.end,
        background: ASSETS.backgrounds.finale,
        accent: '#ad92ff',
        accentSoft: 'rgba(173, 146, 255, 0.24)',
        unlockAfterCategoryId: 'life',
        questions: [
          {
            id: 'finale-1',
            title: '하늘로 쏘는 빛',
            shortTitle: 'BEACON',
            description: '피라미드 위에서 빛 기둥을 만드는 블록을 맞히는 예시 문제.',
            file: 'pages/finale/q1.html',
            icon: ASSETS.icons.beacon,
            frameType: 'challenge',
            acceptedAnswers: ['BEACON'],
            prerequisiteIds: [],
            hints: [
              '네더 스타를 재료로 사용하는 블록입니다.',
              '피라미드 위에 두면 빛 기둥이 솟습니다.',
              '정답은 영어 6글자, BEACON 입니다.'
            ]
          },
          {
            id: 'finale-2',
            title: '부술 수 없는 끝',
            shortTitle: 'BEDROCK',
            description: '최종 예시 문제. 완료하면 전체 진행률이 100%가 됩니다.',
            file: 'pages/finale/q2.html',
            icon: ASSETS.icons.bedrock,
            frameType: 'goal',
            acceptedAnswers: ['BEDROCK'],
            prerequisiteIds: ['finale-1'],
            hints: [
              '기본 서바이벌에서 파괴할 수 없습니다.',
              '월드 최하단과 엔드 포털 부근에서 자주 보입니다.',
              '정답은 영어 7글자, BEDROCK 입니다.'
            ]
          }
        ]
      }
    ]
  };

  window.ARGData = SITE_CONFIG;
})();
