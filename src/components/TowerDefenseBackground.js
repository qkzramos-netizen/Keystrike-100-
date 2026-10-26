
      import React, { useEffect, useRef } from 'react';
      import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

      const SCENE = {
        sky: require('../../public/background/processed/sky_base.png'),
        moon: require('../../public/background/processed/moon.png'),
        star: require('../../public/background/processed/star_small.png'),
        sparkle: require('../../public/background/processed/star_sparkle.png'),
        mountains: require('../../public/background/processed/mountains.png'),
        hills: require('../../public/background/processed/hills_back.png'),
        castle: require('../../public/background/castle_base3.png'),
        flag: require('../../public/background/processed/castle_flag_large.png'),
        castleGlow: require('../../public/background/processed/castle_glow.png'),
        grassPath: require('../../public/background/processed/battlefield_path.png'),
        flower: require('../../public/background/processed/flower_purple.png'),
        glowingPlant: require('../../public/background/processed/glowing_plant.png'),
        grassTuft: require('../../public/background/processed/grass_tuft.png'),
        particle: require('../../public/background/processed/magic_particle.png'),
        musicalNote: require('../../public/background/processed/music_note_gold.png'),
      };

      const PIANOMAN = require('../../public/background/processed/pianoman.png');

      const STARS = [
        { left: '8%', top: '8%', size: 34, sparkle: true, duration: 3100 },
        { left: '29%', top: '16%', size: 27, duration: 4200 },
        { left: '51%', top: '6%', size: 30, sparkle: true, duration: 3600 },
        { left: '76%', top: '12%', size: 25, duration: 3900 },
        { left: '91%', top: '25%', size: 31, sparkle: true, duration: 4700 },
        { left: '43%', top: '28%', size: 23, duration: 4400 },
      ];

      const PARTICLES = [
        { left: '72%', top: '52%', size: 24, duration: 3000 },
        { left: '84%', top: '47%', size: 20, duration: 3600 },
        { left: '94%', top: '55%', size: 22, duration: 3300 },
        { left: '78%', top: '42%', size: 18, duration: 4100 },
      ];

      const MUSIC_NOTE = { left: '65%', top: '22%', size: 22 };

      function createPulse(progress, duration) {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(progress, {
              toValue: 1,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(progress, {
              toValue: 0,
              duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
      }

      const TowerDefenseBackground = React.memo(function TowerDefenseBackground({
        paused,
      }) {
        const moonProgress = useRef(new Animated.Value(0)).current;
        const mountainProgress = useRef(new Animated.Value(0)).current;
        const hillProgress = useRef(new Animated.Value(0)).current;
        const castleGlowProgress = useRef(new Animated.Value(0)).current;
        const flagProgress = useRef(new Animated.Value(0)).current;
        const noteProgress = useRef(new Animated.Value(0)).current;

        const starProgressRef = useRef(null);
        if (!starProgressRef.current) {
          starProgressRef.current = STARS.map(() => new Animated.Value(0));
        }
        const starProgress = starProgressRef.current;

        const particleProgressRef = useRef(null);
        if (!particleProgressRef.current) {
          particleProgressRef.current = PARTICLES.map(() => new Animated.Value(0));
        }
        const particleProgress = particleProgressRef.current;

        const plantProgress = useRef(new Animated.Value(0)).current;

        useEffect(() => {
          if (paused) return undefined;

          const loops = [
            createPulse(moonProgress, 7000),
            createPulse(mountainProgress, 26000),
            createPulse(hillProgress, 19000),
            createPulse(castleGlowProgress, 5200),
            createPulse(flagProgress, 1800),
            createPulse(plantProgress, 6200),
            createPulse(noteProgress, 8400),

            ...starProgress.map((progress, index) =>
              createPulse(progress, STARS[index].duration)
            ),

            ...particleProgress.map((progress, index) =>
              Animated.loop(
                Animated.sequence([
                  Animated.delay(index * 370),
                  Animated.timing(progress, {
                    toValue: 1,
                    duration: PARTICLES[index].duration,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                  }),
                  Animated.timing(progress, {
                    toValue: 0,
                    duration: 1,
                    useNativeDriver: true,
                  }),
                ])
              )
            ),
          ];

          loops.forEach((loop) => loop.start());

          return () => loops.forEach((loop) => loop.stop());
        }, [
          castleGlowProgress,
          flagProgress,
          hillProgress,
          moonProgress,
          mountainProgress,
          noteProgress,
          particleProgress,
          paused,
          plantProgress,
          starProgress,
        ]);

        return (
          <View pointerEvents="none" style={styles.scene}>
            <View style={styles.frame}>
              <Image
                source={SCENE.sky}
                resizeMode="cover"
                style={styles.sky}
              />

              <Animated.Image
                source={SCENE.moon}
                resizeMode="contain"
                style={[
                  styles.moon,
                  {
                    transform: [
                      {
                        translateY: moonProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -4],
                        }),
                      },
                    ],
                  },
                ]}
              />

              {STARS.map((star, index) => {
                const progress = starProgress[index];

                return (
                  <Animated.Image
                    key={`star-${index}`}
                    source={star.sparkle ? SCENE.sparkle : SCENE.star}
                    resizeMode="contain"
                    style={{
                      position: 'absolute',
                      left: star.left,
                      top: star.top,
                      width: star.size,
                      height: star.size,
                      opacity: progress.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.28, 0.9, 0.28],
                      }),
                      transform: [
                        {
                          scale: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.84, 1.08],
                          }),
                        },
                      ],
                    }}
                  />
                );
              })}

              <Animated.Image
                source={SCENE.musicalNote}
                resizeMode="contain"
                style={{
                  position: 'absolute',
                  left: MUSIC_NOTE.left,
                  top: MUSIC_NOTE.top,
                  width: MUSIC_NOTE.size,
                  height: MUSIC_NOTE.size,
                  opacity: noteProgress.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.18, 0.6, 0.18],
                  }),
                  transform: [
                    {
                      translateY: noteProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                      }),
                    },
                    {
                      translateX: noteProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 3],
                      }),
                    },
                  ],
                }}
              />

              <Animated.View
                style={[
                  styles.mountains,
                  {
                    transform: [
                      {
                        translateX: mountainProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-3, 3],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={SCENE.mountains}
                  resizeMode="contain"
                  style={styles.layerImage}
                />
              </Animated.View>

              <Animated.View
                style={[
                  styles.hills,
                  {
                    transform: [
                      {
                        translateX: hillProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [3, -3],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Image
                  source={SCENE.hills}
                  resizeMode="contain"
                  style={styles.layerImage}
                />
              </Animated.View>

              <Animated.Image
                source={SCENE.castleGlow}
                resizeMode="contain"
                style={[
                  styles.castleGlow,
                  {
                    opacity: castleGlowProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.28, 0.56],
                    }),
                  },
                ]}
              />

              <Image
                source={SCENE.castle}
                resizeMode="contain"
                style={styles.castle}
              />

              <Animated.Image
                source={SCENE.flag}
                resizeMode="contain"
                style={[
                  styles.flag,
                  {
                    transform: [
                      {
                        rotate: flagProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-1deg', '1deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />

              <Animated.Image
                source={SCENE.grassTuft}
                resizeMode="contain"
                style={[
                  styles.leftPlant,
                  {
                    transform: [
                      {
                        rotate: plantProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['-1deg', '1deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />

              <Animated.Image
                source={SCENE.glowingPlant}
                resizeMode="contain"
                style={[
                  styles.rightPlant,
                  {
                    transform: [
                      {
                        rotate: plantProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['1deg', '-1deg'],
                        }),
                      },
                    ],
                  },
                ]}
              />

              <Image
                source={SCENE.flower}
                resizeMode="contain"
                style={styles.flower}
              />

              {PARTICLES.map((particle, index) => {
                const progress = particleProgress[index];

                return (
                  <Animated.Image
                    key={`particle-${index}`}
                    source={SCENE.particle}
                    resizeMode="contain"
                    style={{
                      position: 'absolute',
                      left: particle.left,
                      top: particle.top,
                      width: particle.size,
                      height: particle.size,
                      opacity: progress.interpolate({
                        inputRange: [0, 0.25, 0.8, 1],
                        outputRange: [0, 0.65, 0.45, 0],
                      }),
                      transform: [
                        {
                          translateY: progress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -26],
                          }),
                        },
                      ],
                    }}
                  />
                );
              })}
            </View>
          </View>
        );
      });


      export const BattlefieldGround = React.memo(function BattlefieldGround({
  paused,
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (paused) return undefined;

    const animation = createPulse(progress, 18000);
    animation.start();

    return () => animation.stop();
  }, [paused, progress]);

  return (
    <View
      pointerEvents="none"
      style={styles.groundContainer}
    >
      <Animated.Image
        source={SCENE.grassPath}
        resizeMode="stretch"
        style={[
          styles.battlefield,
          {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-2, 2],
                }),
              },
            ],
          },
        ]}
      />
    </View>
  );
});


      export const PianomanDestination = React.memo(function PianomanDestination({
        monsterSize,
        laneTop,
        paused,
      }) {
        const floatProgress = useRef(new Animated.Value(0)).current;

        useEffect(() => {
          if (paused) return undefined;

          const animation = createPulse(floatProgress, 3600);
          animation.start();

          return () => animation.stop();
        }, [floatProgress, paused]);

        const height = monsterSize * 0.95;
        const width = height * (512 / 405);

        return (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: 0,
              top: laneTop + monsterSize - height,
              width,
              height,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: floatProgress.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.92, 1, 0.92],
              }),
              transform: [
                {
                  translateY: floatProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                },
              ],
              zIndex: 1,
            }}
          >
            <Image
              source={PIANOMAN}
              resizeMode="contain"
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
        );
      });

      const styles = StyleSheet.create({
        scene: {
          ...StyleSheet.absoluteFillObject,
          overflow: 'hidden',
          backgroundColor: '#070d27',
          zIndex: 0,
          alignItems: 'center',
        },

        frame: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
      },

        sky: {
          ...StyleSheet.absoluteFillObject,
          width: '100%',
          height: '100%',
        },

        moon: {
          position: 'absolute',
          left: '5%',
          top: '11%',
          width: '22%',
          height: '11%',
        },

        mountains: {
          position: 'absolute',
          left: '-8%',
          bottom: '37%',
          width: '116%',
          aspectRatio: 1696 / 624,
        },

        hills: {
          position: 'absolute',
          left: '-7%',
          bottom: '29%',
          width: '114%',
          aspectRatio: 1696 / 624,
        },

        layerImage: {
          ...StyleSheet.absoluteFillObject,
          width: '100%',
          height: '100%',
        },

        castleGlow: {
          position: 'absolute',
          right: '-10%',
          bottom: '27%',
          width: '66%',
          height: '28%',
        },

        castle: {
          position: 'absolute',
          right: '-3%',
          bottom: '21.9%',
          height: '49%',
          width: '50%',
        },

        flag: {
          position: 'absolute',
          right: '17%',
          top: '100%',
          width: '8%',
          height: '14%',
        },

      

      groundContainer: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: '14%',
  height: '22%',
  overflow: 'hidden',
  zIndex: 0,
},

battlefield: {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
},



        leftPlant: {
          position: 'absolute',
          left: '-4%',
          bottom: '29%',
          width: '34%',
          height: '16%',
        },

        rightPlant: {
          position: 'absolute',
          right: '-6%',
          bottom: '100%',
          width: '32%',
          height: '16%',
        },

        flower: {
          position: 'absolute',
          left: '12%',
          bottom: '2%',
          width: '17%',
          height: '9%',
        },
      });

      export default TowerDefenseBackground;
