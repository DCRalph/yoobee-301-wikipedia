import { cleanContent } from './cleanContent.js'

describe('cleanContent function', () => {
  describe('Summary block removal', () => {
    test('test 1', () => {
      const input = ':::summary:::\n # Title\nContent here';
      const expected = '# Title\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 2', () => {
      const input = ':::summary\n:::  \n# Title\nContent here';
      const expected = '# Title\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 3', () => {
      const input = ':::summary\n:::  #\nTitle\nContent here';
      const expected = 'Content here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 4', () => {
      const input = ':::summary\n:::  # \n Title \nContent here';
      const expected = 'Title\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 42', () => {
      const input = ':::summary\n::: \n  # \n Title \nContent here';
      const expected = 'Title\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 5', () => {
      const input = '# \nTitle\nContent here';
      const expected = 'Title\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 55', () => {
      const input = '# \n# Title\nContent here';
      const expected = '# Title\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 6', () => {
      const input = '# \n# Title \nContent here';
      const expected = '# Title \nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

    // Additional test cases

    test('test 7: no summary block, no changes', () => {
      const input = 'Regular content with no summary marker\nand some text.';
      const expected = 'Regular content with no summary marker\nand some text.';
      expect(cleanContent(input)).toBe(expected);
    });

    test('test 8: empty string', () => {
      const input = '';
      const expected = '';
      expect(cleanContent(input)).toBe(expected);
    });


    test('test 10: leading whitespace before hash does not trigger removal',
      () => {
        const input = '# \n  # Title\nContent here';
        const expected = '# Title\nContent here';
        expect(cleanContent(input)).toBe(expected);
      }
    );

    test('test 11: only remove leading "# " from the first line', () => {
      const input = '# Title\n# Subtitle\nContent here';
      const expected = '# Title\n# Subtitle\nContent here';
      expect(cleanContent(input)).toBe(expected);
    });

  });
});

