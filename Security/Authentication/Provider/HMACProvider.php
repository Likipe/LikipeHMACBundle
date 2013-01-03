<?php

namespace Likipe\HMACBundle\Security\Authentication\Provider;

use Symfony\Component\Security\Core\Authentication\Provider\AuthenticationProviderInterface;
use Symfony\Component\Security\Core\User\UserProviderInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\NonceExpiredException;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Likipe\HMACBundle\Security\Authentication\Token\HMACToken;

class HMACProvider implements AuthenticationProviderInterface
{
	protected $userProvider;
	
	public function __construct(UserProviderInterface $userProvider)
	{
		$this->userProvider = $userProvider;
	}
	
	public function authenticate(TokenInterface $token)
	{
		$user = $this->userProvider->loadUserByUsername($token->id);
		
		$hmac = $this->hashWithKey($token->reqStr, $user->getPassword());
		
		if($hmac === $token->mac) {
			$tok = new HMACToken($user->getRoles());
			$tok->setUser($user);
			$tok->setAuthenticated(true);
			
			return $tok;
		}
		
		throw new AuthenticationException('HMAC Authentication failed.');
	}
	
	public function hashWithKey($bytes, $key)
	{
		return base64_encode(hash_hmac('sha256', $bytes, $key, true));
	}
	
	public function supports(TokenInterface $token)
	{
		return $token instanceof HMACToken;
	}
}
