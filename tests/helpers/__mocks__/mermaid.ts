const mermaidMock = {
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: "<svg></svg>" }),
};

export default mermaidMock;
