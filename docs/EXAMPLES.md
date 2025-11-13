# Usage Examples

Real-world examples of using the iOS Simulator MCP Extension with Cursor.

## Basic Examples

### Example 1: Manual Screenshot Capture

**You ask:**
```
"Can you capture a screenshot of the iOS simulator?"
```

**AI responds:**
```
Screenshot captured successfully!

Timestamp: 11/13/2024, 3:45:23 PM
Filename: screenshot-1731537923456.png
Device: iPhone 15 Pro

You can view it using the resource: simulator://screenshot/1731537923456
```

### Example 2: Check Simulator Status

**You ask:**
```
"Is the iOS simulator running? What device?"
```

**AI uses the tool and responds:**
```
iOS Simulator Status:

Running: Yes

Booted Device:
  Name: iPhone 15 Pro
  UDID: 7A8B9C0D-1E2F-3A4B-5C6D-7E8F9A0B1C2D
  Runtime: com.apple.CoreSimulator.SimRuntime.iOS-17-0

Available Devices: 12
  - iPhone 14 (Shutdown)
  - iPhone 14 Pro (Shutdown)
  - iPhone 15 Pro (Booted)
  - iPad Pro (12.9-inch) (Shutdown)
  - iPad Air (Shutdown)
```

## UI Development Examples

### Example 3: Button Styling Feedback

**Scenario:** You just updated button styling in `LoginScreen.tsx`

**You ask:**
```
"I just updated the login button styling. Can you capture a screenshot 
and tell me if the button looks properly centered and if the colors match 
our brand guidelines (primary blue: #0066CC)?"
```

**AI response:**
```
I've captured a screenshot of your login screen. Let me analyze the button:

Looking at the login button:
✅ Positioning: The button appears properly centered horizontally
✅ Spacing: Good padding around the button (appears to be ~40px margins)
⚠️ Color: The button color looks slightly lighter than the specified #0066CC. 
   It appears more like #3388DD. You may want to verify the StyleSheet definition.
✅ Text: "Sign In" text is clearly visible and well-centered
✅ Touch target: Button height looks adequate for touch interaction (~48px)

Suggestion: Double-check the backgroundColor in your StyleSheet to ensure 
it's using '#0066CC' and not a lighter shade.
```

### Example 4: Layout Issue Detection

**You ask:**
```
"I'm seeing reports of text being cut off on smaller screens. 
Can you capture a screenshot and identify any text overflow issues?"
```

**AI response:**
```
I've captured the current view. I can see a few layout issues:

1. ⚠️ Text Truncation: The welcome message "Welcome back to our amazing 
   application" is being cut off at the right edge. The text appears to 
   need either:
   - numberOfLines prop with ellipsizeMode
   - Or a smaller fontSize
   - Or better container padding

2. ⚠️ Button Overlap: The "Get Started" button is partially overlapping 
   with the text above it. Consider adding marginBottom to the text 
   container or marginTop to the button.

3. ✅ Image: The logo appears to be rendering correctly at the top.

Would you like me to suggest specific code fixes for these issues?
```

## Workflow Examples

### Example 5: Multi-Screen Flow Testing

**You say:**
```
"I'm going to navigate through the onboarding flow. I'll tell you when 
to capture screenshots at each step."
```

Then after each step:
```
"Capture screenshot of welcome screen"
"Capture screenshot of permissions screen"
"Capture screenshot of profile setup screen"
"Capture screenshot of completion screen"
```

Then:
```
"Show me the screenshot history and identify any inconsistencies 
in spacing, colors, or typography across these screens."
```

**AI analyzes all screenshots and responds:**
```
I've reviewed the 4 screenshots from your onboarding flow:

Consistency Analysis:

✅ Typography:
- All headers use consistent font size (~24px)
- Body text maintains 16px across screens

⚠️ Spacing Issues:
- Welcome screen: 60px top padding
- Permissions screen: 80px top padding ← Inconsistent
- Profile setup: 60px top padding
- Completion: 60px top padding

✅ Colors:
- Primary buttons all use #0066CC consistently
- Background color consistent (#FFFFFF)

⚠️ Button Positioning:
- Screens 1, 3, 4: Buttons aligned at bottom (40px from edge)
- Screen 2: Button appears to be 60px from bottom ← Inconsistent

Recommendation: Standardize spacing on the permissions screen to match 
the others. Consider creating a reusable <OnboardingLayout> component 
to ensure consistency.
```

### Example 6: Design Comparison

**You share a design mockup and ask:**
```
"Here's the design mockup for the home screen [attach image]. 
Can you capture the current simulator and tell me what differences 
there are?"
```

**AI response:**
```
I've compared the design mockup with the current implementation:

Differences Found:

1. Card Shadows:
   - Design: Soft shadow with ~8px blur
   - Current: No shadow visible
   - Fix: Add shadow to card StyleSheet

2. Icon Size:
   - Design: Icons appear to be 32x32px
   - Current: Icons look smaller, around 24x24px
   - Fix: Update icon size props

3. Spacing:
   - Design: 24px between cards
   - Current: About 16px between cards
   - Fix: Increase marginBottom in card styles

4. Font Weight:
   - Design: Card titles appear bold (700)
   - Current: Regular weight (400)
   - Fix: Add fontWeight: 'bold' to title styles

5. ✅ Colors match the design perfectly
6. ✅ Layout structure is correct
7. ✅ Text content matches

Overall: ~80% match. The layout and colors are great; just need to 
adjust shadows, spacing, and typography to fully match the design.

Would you like me to generate the StyleSheet changes?
```

## Automatic Capture Examples

### Example 7: Auto-Capture During Development

**Scenario:** You're making rapid UI changes. Auto-capture is enabled.

You edit `ProfileScreen.tsx`:
```typescript
// Add a new section
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Settings</Text>
  <Button title="Edit Profile" onPress={handleEdit} />
</View>
```

*Save file → Extension automatically captures screenshot after 2 seconds*

Then you ask:
```
"Show me the latest screenshot. Did the settings section appear correctly?"
```

**AI response:**
```
Yes! The settings section is now visible in the latest screenshot. 

I can see:
✅ "Settings" title rendered in the expected font
✅ "Edit Profile" button positioned below the title
✅ Section properly contained within the screen boundaries

The auto-capture worked perfectly. The screenshot was triggered by your 
change to ProfileScreen.tsx.
```

## Advanced Examples

### Example 8: Toggle Auto-Capture

**You ask:**
```
"I'm about to make a lot of non-UI changes. Disable auto-capture for now."
```

**AI response:**
```
Auto-capture disabled. Screenshots will no longer be automatically captured 
when UI files change. You can still manually request screenshots anytime.

To re-enable later, just ask me to "enable auto-capture".
```

Later:
```
"Enable auto-capture again"
```

**AI response:**
```
Auto-capture enabled. Screenshots will now be automatically captured when 
UI files change.
```

### Example 9: Performance Testing

**You ask:**
```
"I'm testing animation performance. Capture a screenshot after the animation 
completes and tell me if any UI elements look misaligned."
```

*You trigger the animation in simulator*

**You:** "Capture now"

**AI analyzes and responds:**
```
Screenshot captured after animation. Checking alignment...

⚠️ Potential Issue Detected:
The card at the bottom of the screen appears slightly misaligned - it's 
not fully reaching the edge of the screen. This might be a rounding error 
in the animation's final position.

Suggestion: In your animation code, ensure the final animated value rounds 
to a whole number or snaps to the intended position using toValue with 
Math.round().

All other elements appear properly aligned.
```

### Example 10: Debugging Visual Regression

**You ask:**
```
"I updated my navigation library. Can you capture screenshots as I navigate 
through the app and check if any transitions look broken?"
```

*Navigate through app*

**You:** "Capture screenshot of each screen: Home, Profile, Settings, About"

**AI analyzes the sequence:**
```
I've captured 4 screenshots during your navigation. Analysis:

Home → Profile transition: ✅ Clean
Profile → Settings transition: ✅ Clean
Settings → About transition: ⚠️ Issue detected

On the About screen screenshot, I notice:
- The header appears to be rendering on top of the previous screen's content
- There's a visual "flash" artifact visible
- Status bar color doesn't match other screens

This suggests the navigation transition might not be fully completing 
or there's a z-index issue with the header.

Check your navigation config for the About screen, specifically:
- headerMode
- cardStyle
- transitionSpec timing
```

## Tips for Best Results

1. **Be Specific**: Tell the AI exactly what to look for
2. **Provide Context**: Mention what you just changed or what you're trying to achieve
3. **Compare**: Ask the AI to compare screenshots or designs
4. **Describe Issues**: If you see a problem, describe it and ask the AI to verify
5. **Request Advice**: Ask for implementation suggestions based on what the AI sees

## Combining with Other Tools

The iOS Simulator MCP Extension works great alongside:
- React Native Debugger
- Flipper
- XCode Instruments
- Design tools (Figma, Sketch)

Ask the AI to capture screenshots and correlate them with debugger output 
or performance metrics for comprehensive analysis!

