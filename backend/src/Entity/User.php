<?php

namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $firstname = null;

    #[ORM\Column(length: 255)]
    private ?string $lastname = null;

    #[ORM\Column(length: 255)]
    private ?string $pseudo = null;

    #[ORM\Column(length: 255)]
    private ?string $email = null;

    #[ORM\Column(length: 255)]
    private ?string $password = null;

    #[ORM\Column(type: Types::ARRAY)]
    private array $roles = [];

    /**
     * @var Collection<int, Ban>
     */
    #[ORM\OneToMany(targetEntity: Ban::class, mappedBy: 'user')]
    private Collection $Ban;

    /**
     * @var Collection<int, Message>
     */
    #[ORM\OneToMany(targetEntity: Message::class, mappedBy: 'user')]
    private Collection $Message;

    /**
     * @var Collection<int, Reaction>
     */
    #[ORM\OneToMany(targetEntity: Reaction::class, mappedBy: 'user')]
    private Collection $Reaction;

    /**
     * @var Collection<int, Notification>
     */
    #[ORM\OneToMany(targetEntity: Notification::class, mappedBy: 'user')]
    private Collection $Notification;

    /**
     * @var Collection<int, UserScore>
     */
    #[ORM\OneToMany(targetEntity: UserScore::class, mappedBy: 'user')]
    private Collection $UserScore;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $profile_picture = null;
   
    #[ORM\Column(type: 'boolean', options: ['default' => false])]
private bool $isVerified = false;

#[ORM\Column(length: 255, nullable: true)]
private ?string $verificationToken = null;

#[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
private ?\DateTimeInterface $verificationTokenExpiresAt = null;


    public function __construct()
    {
        $this->Ban = new ArrayCollection();
        $this->Message = new ArrayCollection();
        $this->Reaction = new ArrayCollection();
        $this->Notification = new ArrayCollection();
        $this->UserScore = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFirstname(): ?string
    {
        return $this->firstname;
    }

    public function setFirstname(string $firstname): static
    {
        $this->firstname = $firstname;

        return $this;
    }

    public function getLastname(): ?string
    {
        return $this->lastname;
    }

    public function setLastname(string $lastname): static
    {
        $this->lastname = $lastname;

        return $this;
    }

    public function getPseudo(): ?string
    {
        return $this->pseudo;
    }

    public function setPseudo(string $pseudo): static
    {
        $this->pseudo = $pseudo;

        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;

        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;

        return $this;
    }

    public function getRoles(): array
{
    $roles = $this->roles;
    
    $roles[] = 'ROLE_USER';

    return array_unique($roles);
}

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;

        return $this;
    }

    /**
     * @return Collection<int, Ban>
     */
    public function getBan(): Collection
    {
        return $this->Ban;
    }

    public function addBan(Ban $ban): static
    {
        if (!$this->Ban->contains($ban)) {
            $this->Ban->add($ban);
            $ban->setUser($this);
        }

        return $this;
    }

    public function removeBan(Ban $ban): static
    {
        if ($this->Ban->removeElement($ban)) {
            // set the owning side to null (unless already changed)
            if ($ban->getUser() === $this) {
                $ban->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Message>
     */
    public function getMessage(): Collection
    {
        return $this->Message;
    }

    public function addMessage(Message $message): static
    {
        if (!$this->Message->contains($message)) {
            $this->Message->add($message);
            $message->setUser($this);
        }

        return $this;
    }

    public function removeMessage(Message $message): static
    {
        if ($this->Message->removeElement($message)) {
            // set the owning side to null (unless already changed)
            if ($message->getUser() === $this) {
                $message->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Reaction>
     */
    public function getReaction(): Collection
    {
        return $this->Reaction;
    }

    public function addReaction(Reaction $reaction): static
    {
        if (!$this->Reaction->contains($reaction)) {
            $this->Reaction->add($reaction);
            $reaction->setUser($this);
        }

        return $this;
    }

    public function removeReaction(Reaction $reaction): static
    {
        if ($this->Reaction->removeElement($reaction)) {
            // set the owning side to null (unless already changed)
            if ($reaction->getUser() === $this) {
                $reaction->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Notification>
     */
    public function getNotification(): Collection
    {
        return $this->Notification;
    }

    public function addNotification(Notification $notification): static
    {
        if (!$this->Notification->contains($notification)) {
            $this->Notification->add($notification);
            $notification->setUser($this);
        }

        return $this;
    }

    public function removeNotification(Notification $notification): static
    {
        if ($this->Notification->removeElement($notification)) {
            // set the owning side to null (unless already changed)
            if ($notification->getUser() === $this) {
                $notification->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, UserScore>
     */
    public function getUserScore(): Collection
    {
        return $this->UserScore;
    }

    public function addUserScore(UserScore $userScore): static
    {
        if (!$this->UserScore->contains($userScore)) {
            $this->UserScore->add($userScore);
            $userScore->setUser($this);
        }

        return $this;
    }

    public function removeUserScore(UserScore $userScore): static
    {
        if ($this->UserScore->removeElement($userScore)) {
            // set the owning side to null (unless already changed)
            if ($userScore->getUser() === $this) {
                $userScore->setUser(null);
            }
        }

        return $this;
    }

    public function getProfilePicture(): ?string
    {
        return $this->profile_picture;
    }

    public function setProfilePicture(?string $profile_picture): static
    {
        $this->profile_picture = $profile_picture;

        return $this;
    }

    public function getUserIdentifier(): string
{
    return (string) $this->email;
}

public function eraseCredentials(): void
{
    // If you store any temporary, sensitive data on the user, clear it here
    // $this->plainPassword = null;
}

public function isVerified(): bool
{
    return $this->isVerified;
}

public function setIsVerified(bool $isVerified): static
{
    $this->isVerified = $isVerified;

    return $this;
}

public function getVerificationToken(): ?string
{
    return $this->verificationToken;
}

public function setVerificationToken(?string $verificationToken): static
{
    $this->verificationToken = $verificationToken;

    return $this;
}

public function getVerificationTokenExpiresAt(): ?\DateTimeInterface
{
    return $this->verificationTokenExpiresAt;
}

public function setVerificationTokenExpiresAt(?\DateTimeInterface $verificationTokenExpiresAt): static
{
    $this->verificationTokenExpiresAt = $verificationTokenExpiresAt;

    return $this;
}
}
