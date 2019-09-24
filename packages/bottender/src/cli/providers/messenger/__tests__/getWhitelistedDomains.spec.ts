import { MessengerClient } from 'messaging-api-messenger';

import getConfig from '../../../shared/getConfig';
import { getWhitelistedDomains } from '../whitelisted-domains';
import * as log from '../../../shared/log';

jest.mock('messaging-api-messenger');

jest.mock('../../../shared/log');
jest.mock('../../../shared/getConfig');

const MOCK_FILE_WITH_PLATFORM = {
  channels: {
    messenger: {
      accessToken: '__FAKE_TOKEN__',
    },
  },
};

let _client;

beforeEach(() => {
  _client = {
    getWhitelistedDomains: jest.fn(),
  };
  MessengerClient.connect = jest.fn(() => _client);
  log.error = jest.fn();
  log.print = jest.fn();
  getConfig.mockReturnValue(MOCK_FILE_WITH_PLATFORM.channels.messenger);
});

it('be defined', () => {
  expect(getWhitelistedDomains).toBeDefined();
});

describe('resolved', () => {
  it('call getWhitelistedDomains', async () => {
    const ctx = {
      argv: {},
    };

    _client.getWhitelistedDomains.mockResolvedValue([
      'http://www.facebook.com',
      'http://www.yoctol.com',
    ]);

    await getWhitelistedDomains(ctx);

    expect(_client.getWhitelistedDomains).toBeCalled();
  });

  it('error when no config setting', async () => {
    const ctx = {
      argv: {},
    };

    _client.getWhitelistedDomains.mockResolvedValue(null);

    await getWhitelistedDomains(ctx);

    expect(log.error).toBeCalled();
    expect(_client.getWhitelistedDomains).toBeCalled();
  });
});

describe('reject', () => {
  it('handle error thrown with only status', async () => {
    const ctx = {
      argv: {},
    };
    const error = {
      response: {
        status: 400,
      },
    };
    _client.getWhitelistedDomains.mockRejectedValue(error);

    process.exit = jest.fn();

    await getWhitelistedDomains(ctx);

    expect(log.error).toBeCalled();
    expect(process.exit).toBeCalled();
  });

  it('handle error thrown by messenger', async () => {
    const ctx = {
      argv: {},
    };
    const error = {
      response: {
        status: 400,
        data: {
          error: {
            message: '(#100) ...',
            type: 'OAuthException',
            code: 100,
            error_subcode: 2018145,
            fbtrace_id: 'HXd3kIOXLsK',
          },
        },
      },
    };
    _client.getWhitelistedDomains.mockRejectedValue(error);

    process.exit = jest.fn();

    await getWhitelistedDomains(ctx);

    expect(log.error).toBeCalled();
    expect(log.error.mock.calls[2][0]).not.toMatch(/\[object Object\]/);
    expect(process.exit).toBeCalled();
  });

  it('handle error thrown by ourselves', async () => {
    const ctx = {
      argv: {},
    };
    const error = {
      message: 'something wrong happened',
    };
    _client.getWhitelistedDomains.mockRejectedValue(error);

    process.exit = jest.fn();

    await getWhitelistedDomains(ctx);

    expect(log.error).toBeCalled();
    expect(process.exit).toBeCalled();
  });
});