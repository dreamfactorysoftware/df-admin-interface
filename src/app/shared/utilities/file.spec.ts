import { readAsText, saveAsFile } from './file';

describe('readAsText function', () => {
  it('should read a file and emit its content as a string', done => {
    const mockFile = new Blob(['sample content'], { type: 'text/plain' });

    const mockReader = {
      readAsText: jest.fn(),
      onload: jest.fn(),
      onerror: jest.fn(),
      result: 'sample content',
    };

    (global as any).FileReader = jest.fn(() => mockReader);

    readAsText(mockFile).subscribe(data => {
      expect(data).toBe('sample content');
      done();
    });

    mockReader.onload();
  });

  it('should save data as a file', () => {
    const mockData = 'sample content';
    const mockBlob = new Blob([mockData], { type: 'application/json' });
    const url = 'blob:sample-url';

    const mockURL = {
      createObjectURL: jest.fn(() => url),
      revokeObjectURL: jest.fn(),
    };

    (global as any).URL = mockURL;

    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document, 'appendChild');
    const clickSpy = jest.fn();

    createElementSpy.mockReturnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    saveAsFile(mockBlob, 'sample-file.txt');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(clickSpy).toHaveBeenCalled();

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
  });
});
