# Breakout

Breakout game remade with BabylonJS game engine and new improved features.

# Features

  - 3 Game Scenes
    - Splash Screen
    - Game Scene
    - Game Over Scene
  - Patricle Systems
    - Ball
    - Pendulum ball
  - Efficent Scene swapping
    - See main/main.js to see how scenes are swapped in a neat manner
  - Environment
    - Sky box
    - Fog
    - Textured Walls
    - Shadow Generator to cast shadows on the paddle and walls
  - Complex Physics Imposters
    - Ball collisions are dealt with by complex physic imposters which give the ball an appropriate linear velocity
    - Area Walls have physic imposters to simulate a mass of 0 to allow the ball bounce back and forth
    - Pendulum is a DistanceJoint which must be hit in order to win the game
    - Pendulum box explodes upon blocks being destroyed and a particle system is set off on the pendulum ball
  - Game States
    - Game states keep track of game triggers, when there are no blocks left the pendulum box explodes open with the use forces and physics imposters
    - Powerup manager which gives a player powerups, triggers them and deactivates them.
- Powerups
    - Powerup algorithm which spots vacancies in block gaps and places a powerup within a vacant gap
    - 3 types of powerups
        - LONGER_PADDLE, which scales the paddle to be twice as long
        - SPEED_UP, which allows a players paddle to move twice as fast
        - SLOW_MOTION, which increases the time step of the physics engine to allow for a slow motion effect.
    - Each powerup lasts 6 seconds and a GUI indicates this.
- Controls
    - A (Move Left)
    - D (Move right)
    - W (Rotate left)
    - S (Rotate right)
    - E (End of game test button, hit to view blocks disappear and pendulum box explode)
    - R (Activates a powerup)
- GUI
    - Splash Screen
        - Play button
    - Game Screen
        - Score
        - Current Powerup
        - Blocks Remaining
        - Powerup time remaining when a powerup is activated, which follows the paddle
    - Game Over Screen
        - Replay
